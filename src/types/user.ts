/**
 * User & Profile Types for D-ELYNX TAILORS HUB
 * Supporting multi-role professional identities in the fashion ecosystem.
 */

export type ProfessionalRole =
  | 'customer'
  | 'designer'
  | 'tailor'
  | 'manufacturer'
  | 'buyer_retailer'
  | 'seller'
  | 'fabric_vendor'
  | 'instructor_mentor'
  | 'moderator'
  | 'admin'
  | 'super_admin';

export type UserRole = ProfessionalRole;

export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'deactivated';

export interface UserProfile {
  id: string; // References auth.users.id
  auth_user_id: string;
  email: string;
  display_name: string;
  profile_image_url?: string | null;
  professional_role: ProfessionalRole;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  phone?: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export type SellerVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface SellerProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_description?: string | null;
  country: string;
  city?: string | null;
  verification_status: SellerVerificationStatus;
  status: 'active' | 'suspended' | 'dormant';
  rating?: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;
}
