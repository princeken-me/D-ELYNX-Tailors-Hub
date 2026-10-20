import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Bell,
  Truck,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Scissors,
} from 'lucide-react';
import { SellerStudioLayout } from '../../components/seller/SellerStudioLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
  SellerCatalogService,
  SellerRecord,
  SellerSettings,
} from '../../services/seller-catalog.service';
import { Button } from '../../components/ui/Button';

export const SellerSettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [seller, setSeller] = useState<SellerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings state
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [acceptsBespokeCustomOrders, setAcceptsBespokeCustomOrders] = useState(true);
  const [notifyOnNewOrder, setNotifyOnNewOrder] = useState(true);
  const [notifyOnLowStock, setNotifyOnLowStock] = useState(true);
  const [notifyOnCustomerInquiry, setNotifyOnCustomerInquiry] = useState(true);
  const [dispatchPolicyNote, setDispatchPolicyNote] = useState('');

  const effectiveUserId = user?.id || profile?.id || profile?.auth_user_id || 'usr-seller-demo';

  const loadSettings = async () => {
    setLoading(true);
    try {
      const record = await SellerCatalogService.getSellerProfile(effectiveUserId);
      if (record) {
        setSeller(record);
        const settings = await SellerCatalogService.getSellerSettings(record.id);
        setLeadTimeDays(settings.leadTimeDays || 7);
        setAcceptsBespokeCustomOrders(settings.acceptsBespokeCustomOrders ?? true);
        setNotifyOnNewOrder(settings.notifyOnNewOrder ?? true);
        setNotifyOnLowStock(settings.notifyOnLowStock ?? true);
        setNotifyOnCustomerInquiry(settings.notifyOnCustomerInquiry ?? true);
        setDispatchPolicyNote(settings.dispatchPolicyNote || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [effectiveUserId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

    setSaving(true);
    setFeedback(null);

    const updated = await SellerCatalogService.updateSellerSettings(seller.id, {
      leadTimeDays: Number(leadTimeDays),
      acceptsBespokeCustomOrders,
      notifyOnNewOrder,
      notifyOnLowStock,
      notifyOnCustomerInquiry,
      dispatchPolicyNote,
    });

    setSaving(false);
    if (updated) {
      setFeedback({
        type: 'success',
        text: 'Atelier fulfillment and notification settings have been updated successfully.',
      });
    } else {
      setFeedback({
        type: 'error',
        text: 'Failed to update settings. Please try again.',
      });
    }
  };

  return (
    <SellerStudioLayout>
      <div id="seller-settings-page" className="space-y-8 pb-12 max-w-4xl">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
            Preferences & Policies
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
            Atelier Operating Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure production lead times, bespoke ordering capacity, and automated alert preferences.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            Loading atelier settings...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            {/* Fulfillment & Production */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <Truck className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-serif uppercase tracking-wider font-semibold text-zinc-200">
                  Fulfillment & Production Turnaround
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">
                    Standard Production & Dispatch Turnaround
                  </label>
                  <div className="relative">
                    <select
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 appearance-none"
                    >
                      <option value={2}>1 - 2 Business Days (Ready-to-wear)</option>
                      <option value={5}>3 - 5 Business Days (Standard tailoring)</option>
                      <option value={7}>7 Business Days (1 Week bespoke)</option>
                      <option value={14}>14 Business Days (2 Weeks full canvass)</option>
                      <option value={21}>21 Business Days (3 Weeks ceremonial agbada)</option>
                      <option value={30}>30 Business Days (Haute Couture Bridal)</option>
                    </select>
                    <Clock className="w-4 h-4 text-zinc-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Displayed transparently to buyers on product pages and checkout receipts.
                  </p>
                </div>

                <div className="space-y-2 flex flex-col justify-center">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <span className="text-xs font-medium text-zinc-200 block">
                        Accept Custom Measurements
                      </span>
                      <p className="text-[11px] text-zinc-500">
                        Allow clients to attach anatomical profile measurements to orders.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptsBespokeCustomOrders}
                      onChange={(e) => setAcceptsBespokeCustomOrders(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-zinc-900 border-zinc-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">
                    Dispatch Policy & Packaging Standards Note
                  </label>
                  <textarea
                    rows={3}
                    value={dispatchPolicyNote}
                    onChange={(e) => setDispatchPolicyNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                    placeholder="e.g. All garments are sealed in breathable garment bags with branded cedar hangers and tracked luxury courier dispatch."
                  />
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-serif uppercase tracking-wider font-semibold text-zinc-200">
                  Notification Preferences
                </h2>
              </div>

              <div className="space-y-3">
                <label className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-medium text-zinc-200 block">
                      New Garment Order Placed
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Receive immediate notification when a client orders garments from your atelier.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOnNewOrder}
                    onChange={(e) => setNotifyOnNewOrder(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-zinc-900 border-zinc-700 cursor-pointer"
                  />
                </label>

                <label className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-medium text-zinc-200 block">
                      Low Stock Threshold Alerts
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Receive an alert when available inventory drops below your configured reorder threshold.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOnLowStock}
                    onChange={(e) => setNotifyOnLowStock(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-zinc-900 border-zinc-700 cursor-pointer"
                  />
                </label>

                <label className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-medium text-zinc-200 block">
                      Client Sizing & Fitting Inquiries
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Receive notifications when prospective buyers ask sizing or tailoring questions.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOnCustomerInquiry}
                    onChange={(e) => setNotifyOnCustomerInquiry(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-zinc-900 border-zinc-700 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
              <Button
                type="submit"
                disabled={saving}
                className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </SellerStudioLayout>
  );
};
