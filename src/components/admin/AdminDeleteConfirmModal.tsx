import React from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { Product } from '../../types/ecommerce';

interface AdminDeleteConfirmModalProps {
  product: Product | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AdminDeleteConfirmModal: React.FC<AdminDeleteConfirmModalProps> = ({
  product,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-red-500/40 shadow-2xl p-6 sm:p-7 space-y-5 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <span className="text-[10px] uppercase font-serif tracking-widest text-red-400 font-semibold">
            Irreversible Content Deletion
          </span>
          <h3 className="font-serif text-xl font-bold text-zinc-100 mt-1">
            Delete Garment Listing?
          </h3>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-zinc-200 font-medium">"{product.name}"</strong> from the
            marketplace catalog? This will remove the listing and its inventory records.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-3">
          {product.hero_image && (
            <img
              src={product.hero_image}
              alt=""
              referrerPolicy="no-referrer"
              className="w-10 h-12 rounded object-cover border border-zinc-700 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-zinc-200 truncate">{product.name}</div>
            <div className="text-[11px] text-zinc-500">{product.category?.name || 'Garment'}</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-red-900/40"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
