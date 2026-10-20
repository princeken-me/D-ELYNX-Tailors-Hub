import React, { useState } from 'react';
import { AlertTriangle, X, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Order } from '../../types/ecommerce';
import { OrderService, CancelOrderResponse } from '../../services/order.service';

interface CancelOrderModalProps {
  order: Order | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onCancelled: (orderId: string) => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  userId,
  isOpen,
  onClose,
  onCancelled,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorFeedback(null);

    try {
      const result: CancelOrderResponse = await OrderService.cancelCustomerOrder(order.id, userId);

      if (result.success) {
        onCancelled(order.id);
        onClose();
      } else {
        setErrorFeedback(result.message);
      }
    } catch (err: any) {
      setErrorFeedback(err?.message || 'An unexpected error occurred while attempting to cancel the order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="cancel-order-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="cancel-order-modal"
        className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Cancel Order</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Reference: <span className="font-mono text-zinc-300 font-semibold">{order.order_number}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning copy */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 space-y-2">
          <p>
            Are you sure you wish to cancel this order?
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Reserved fabrics and garment inventory will be released back to the atelier for other patrons.
          </p>
        </div>

        {/* Error Feedback if any */}
        {errorFeedback && (
          <div
            id="cancel-order-error-message"
            className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-snug">{errorFeedback}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            id="btn-cancel-modal-dismiss"
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            id="btn-confirm-order-cancel"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-rose-900/20 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Cancellation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
