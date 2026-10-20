import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Lock,
  Loader2,
  Sliders,
} from 'lucide-react';
import { SellerInventoryItem, SellerCatalogService } from '../../services/seller-catalog.service';

interface AdjustStockModalProps {
  item: SellerInventoryItem;
  sellerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItem: SellerInventoryItem, message: string) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  item,
  sellerId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [quantityInput, setQuantityInput] = useState('1');
  const [reason, setReason] = useState('Atelier restock / batch completion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Optional reorder threshold editing
  const [showThresholdEdit, setShowThresholdEdit] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(String(item.reorder_threshold ?? 5));
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);

  if (!isOpen) return null;

  const currentAvailable = item.quantity_available;
  const parsedQty = parseInt(quantityInput.trim(), 10);
  const isValidInteger = !isNaN(parsedQty) && Number.isInteger(parsedQty) && parsedQty > 0;

  const delta = isValidInteger ? (mode === 'add' ? parsedQty : -parsedQty) : 0;
  const projectedAvailable = currentAvailable + delta;
  const isNegativeProjection = isValidInteger && projectedAvailable < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidInteger) {
      setErrorMessage('Please enter a valid positive integer quantity.');
      return;
    }

    if (isNegativeProjection) {
      setErrorMessage(
        `Cannot reduce stock below zero. Maximum reduction possible is ${currentAvailable} units.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await SellerCatalogService.adjustInventoryStock({
        sellerId,
        variantId: item.variant_id,
        delta,
        reason,
      });

      if (!res.success || !res.inventory) {
        setErrorMessage(res.error || 'Failed to adjust stock. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const newAvailable = res.inventory.quantity_available;
      const newReserved = res.inventory.quantity_reserved;
      const newTotal = newAvailable + newReserved;
      const threshold = res.inventory.reorder_threshold ?? item.reorder_threshold;

      let newStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (newAvailable <= 0) {
        newStatus = 'out_of_stock';
      } else if (newAvailable <= threshold) {
        newStatus = 'low_stock';
      }

      const updatedItem: SellerInventoryItem = {
        ...item,
        quantity_available: newAvailable,
        quantity_reserved: newReserved,
        quantity_total: newTotal,
        reorder_threshold: threshold,
        status: newStatus,
        updated_at: res.inventory.updated_at,
      };

      const changeDesc =
        mode === 'add' ? `+${parsedQty} units restocked` : `-${parsedQty} units deducted`;
      onSuccess(
        updatedItem,
        `Inventory updated for ${item.product_name} (${item.sku}): ${changeDesc}. Available stock is now ${newAvailable} units.`
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during inventory adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateThreshold = async () => {
    const parsedThreshold = parseInt(thresholdInput.trim(), 10);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setErrorMessage('Reorder threshold must be a non-negative integer.');
      return;
    }

    setIsUpdatingThreshold(true);
    try {
      const res = await SellerCatalogService.updateReorderThreshold({
        sellerId,
        variantId: item.variant_id,
        threshold: parsedThreshold,
      });

      if (!res.success || !res.inventory) {
        setErrorMessage(res.error || 'Failed to update reorder threshold.');
        return;
      }

      const newThreshold = res.inventory.reorder_threshold ?? parsedThreshold;
      let newStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (item.quantity_available <= 0) {
        newStatus = 'out_of_stock';
      } else if (item.quantity_available <= newThreshold) {
        newStatus = 'low_stock';
      }

      const updatedItem: SellerInventoryItem = {
        ...item,
        reorder_threshold: newThreshold,
        status: newStatus,
      };

      setShowThresholdEdit(false);
      onSuccess(
        updatedItem,
        `Reorder threshold for ${item.sku} updated to ${newThreshold} units.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update reorder threshold.');
    } finally {
      setIsUpdatingThreshold(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      id="modal-adjust-stock"
    >
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-amber-400 font-semibold flex items-center gap-1.5">
              <Package className="w-3 h-3" />
              Stock Adjustment
            </span>
            <h2 className="font-serif text-xl font-bold text-zinc-100 leading-tight">
              {item.product_name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {item.sku}
              </span>
              {item.size && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {item.size}
                </span>
              )}
              {item.color && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {item.color}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition cursor-pointer"
            aria-label="Close dialog"
            id="btn-close-adjust-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Available</span>
            <span className="font-serif text-base font-bold text-zinc-100 mt-0.5 block">
              {item.quantity_available} <span className="text-[10px] font-sans font-normal text-zinc-400">units</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-amber-400" />
              Reserved
            </span>
            <span className="font-serif text-base font-bold text-zinc-300 mt-0.5 block">
              {item.quantity_reserved} <span className="text-[10px] font-sans font-normal text-zinc-500">units</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Total Vault</span>
            <span className="font-serif text-base font-bold text-zinc-200 mt-0.5 block">
              {item.quantity_total} <span className="text-[10px] font-sans font-normal text-zinc-400">units</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Alert Below</span>
            <span className="font-serif text-base font-bold text-amber-300 mt-0.5 block">
              {item.reorder_threshold} <span className="text-[10px] font-sans font-normal text-zinc-500">units</span>
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 block">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('add');
                  setErrorMessage(null);
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  mode === 'add'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
                id="btn-mode-add"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restock (+ Add Stock)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('remove');
                  setErrorMessage(null);
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  mode === 'remove'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
                id="btn-mode-remove"
              >
                <Minus className="w-3.5 h-3.5 text-rose-400" />
                <span>Deduction (- Remove Stock)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="input-adjust-qty" className="text-xs font-medium text-zinc-300">
                Quantity to {mode === 'add' ? 'Add' : 'Deduct'} (Units)
              </label>
              {mode === 'remove' && (
                <span className="text-[10px] text-zinc-400">
                  Max available reduction: <strong className="text-zinc-200">{currentAvailable}</strong>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="input-adjust-qty"
                type="number"
                min="1"
                step="1"
                value={quantityInput}
                onChange={(e) => {
                  setQuantityInput(e.target.value);
                  setErrorMessage(null);
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 font-mono text-sm focus:outline-none focus:border-amber-400/80 transition"
                placeholder="e.g. 5"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 pointer-events-none">
                units
              </div>
            </div>
          </div>

          {/* Live Outcome Calculation */}
          {isValidInteger && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                isNegativeProjection
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Current Available:</span>
                <span>{currentAvailable} units</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">
                  {mode === 'add' ? 'Restock Addition:' : 'Reduction:'}
                </span>
                <span className={mode === 'add' ? 'text-emerald-400' : 'text-rose-400'}>
                  {mode === 'add' ? `+${parsedQty}` : `-${parsedQty}`} units
                </span>
              </div>
              <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between font-semibold">
                <span className="text-zinc-200 font-sans">Projected Available:</span>
                <span
                  className={`font-mono text-sm ${
                    isNegativeProjection
                      ? 'text-red-400 font-bold'
                      : projectedAvailable <= item.reorder_threshold
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {projectedAvailable} units
                </span>
              </div>
              {isNegativeProjection && (
                <p className="text-[11px] text-red-400 pt-1 leading-tight">
                  Reduction exceeds current stock. Available stock cannot drop below zero.
                </p>
              )}
            </div>
          )}

          {/* Reason / Memo Selector */}
          <div className="space-y-1.5">
            <label htmlFor="select-adjust-reason" className="text-xs font-medium text-zinc-300 block">
              Reason / Atelier Log Memo
            </label>
            <select
              id="select-adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs focus:outline-none focus:border-amber-400/80 transition"
            >
              {mode === 'add' ? (
                <>
                  <option value="Atelier restock / batch completion">Atelier restock / batch completion</option>
                  <option value="New fabric procurement & garment finishing">New fabric procurement & garment finishing</option>
                  <option value="Physical recount correction (addition)">Physical recount correction (addition)</option>
                  <option value="Returned from showcase / exhibition">Returned from showcase / exhibition</option>
                </>
              ) : (
                <>
                  <option value="Physical recount correction (deduction)">Physical recount correction (deduction)</option>
                  <option value="Damaged / atelier fabric inspection defect">Damaged / atelier fabric inspection defect</option>
                  <option value="Sample pulled for runway / VIP fitting">Sample pulled for runway / VIP fitting</option>
                  <option value="Delisted variant">Delisted variant</option>
                </>
              )}
            </select>
          </div>

          {/* Collapsible Reorder Threshold Editor */}
          <div className="pt-2 border-t border-zinc-800/80">
            {!showThresholdEdit ? (
              <button
                type="button"
                onClick={() => setShowThresholdEdit(true)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
                id="btn-toggle-threshold"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Low-Stock Alert Threshold (Currently {item.reorder_threshold} units)</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">Reorder Threshold</span>
                  <button
                    type="button"
                    onClick={() => setShowThresholdEdit(false)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Item will be flagged as "Low Stock" when available units are at or below this number.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleUpdateThreshold}
                    disabled={isUpdatingThreshold}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                    id="btn-save-threshold"
                  >
                    {isUpdatingThreshold ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    )}
                    <span>Save Threshold</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition cursor-pointer"
              id="btn-cancel-stock-adjustment"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidInteger || isNegativeProjection}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'add'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
              }`}
              id="btn-confirm-stock-adjustment"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adjusting Stock...</span>
                </>
              ) : (
                <span>
                  {mode === 'add'
                    ? `Add ${isValidInteger ? parsedQty : ''} Units to Vault`
                    : `Deduct ${isValidInteger ? parsedQty : ''} Units from Vault`}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
