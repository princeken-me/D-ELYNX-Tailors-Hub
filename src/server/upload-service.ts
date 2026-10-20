/**
 * D-ELYNX TAILORS HUB - File Upload Security Validation Service
 *
 * Enforces file size limits, MIME whitelists, extension validation,
 * path sanitization, and prevents executable/malware file uploads.
 */

export interface FileValidationRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  bucket: 'garment-media' | 'avatars' | 'seller-documents' | 'business-documents';
  userId: string;
}

export interface FileValidationResponse {
  valid: boolean;
  sanitizedPath?: string;
  error?: string;
  maxAllowedBytes?: number;
}

// Strictly prohibited extensions
const BANNED_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.com', '.msi',
  '.php', '.phtml', '.php3', '.php4', '.php5',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.pyc', '.pyw', '.rb', '.pl', '.cgi',
  '.html', '.htm', '.xhtml', '.svg', '.xml', // SVG banned to prevent Stored XSS via script execution
  '.vbs', '.vbe', '.wsf', '.wsh',
  '.dll', '.so', '.dylib', '.bin', '.elf',
  '.apk', '.ipa', '.jar', '.war',
];

// Whitelisted MIME types per bucket
const BUCKET_POLICIES: Record<
  string,
  {
    allowedMimes: string[];
    allowedExtensions: string[];
    maxSizeBytes: number;
    isPublic: boolean;
  }
> = {
  'garment-media': {
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    isPublic: true,
  },
  'avatars': {
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    isPublic: true,
  },
  'seller-documents': {
    allowedMimes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    isPublic: false,
  },
  'business-documents': {
    allowedMimes: ['application/pdf'],
    allowedExtensions: ['.pdf'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    isPublic: false,
  },
};

export class UploadSecurityService {
  /**
   * Validate file metadata before accepting or uploading to Supabase Storage
   */
  public static validateUpload(req: FileValidationRequest): FileValidationResponse {
    const { filename, mimeType, sizeBytes, bucket, userId } = req;

    // 1. Check user ownership
    if (!userId || userId.trim() === '') {
      return { valid: false, error: 'Authentication required. Missing user identity.' };
    }

    // 2. Validate Bucket
    const policy = BUCKET_POLICIES[bucket];
    if (!policy) {
      return { valid: false, error: `Invalid storage bucket: ${bucket}` };
    }

    // 3. Extract and check file extension
    const extMatch = filename.toLowerCase().match(/\.[a-z0-9]+$/);
    const extension = extMatch ? extMatch[0] : '';

    if (!extension) {
      return { valid: false, error: 'File must have a valid extension.' };
    }

    // Reject explicitly banned extensions
    if (BANNED_EXTENSIONS.includes(extension)) {
      return { valid: false, error: `Disallowed dangerous file extension: ${extension}` };
    }

    // Must be in policy's allowed extensions
    if (!policy.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Extension ${extension} is not permitted for bucket ${bucket}. Allowed: ${policy.allowedExtensions.join(', ')}`,
      };
    }

    // 4. Validate MIME type
    if (!policy.allowedMimes.includes(mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `MIME type ${mimeType} is not permitted for bucket ${bucket}. Allowed: ${policy.allowedMimes.join(', ')}`,
      };
    }

    // 5. Enforce size limits
    if (sizeBytes <= 0) {
      return { valid: false, error: 'Empty file detected.' };
    }

    if (sizeBytes > policy.maxSizeBytes) {
      const maxMb = (policy.maxSizeBytes / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        maxAllowedBytes: policy.maxSizeBytes,
        error: `File size exceeds maximum allowable limit of ${maxMb}MB.`,
      };
    }

    // 6. Generate sanitized storage path (prevents directory traversal attacks)
    const baseName = filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);

    const timestamp = Date.now();
    const safeFilename = `${timestamp}_${baseName}${extension}`;
    const sanitizedPath = `${userId}/${safeFilename}`;

    return {
      valid: true,
      sanitizedPath,
      maxAllowedBytes: policy.maxSizeBytes,
    };
  }
}
