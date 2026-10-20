import React from 'react';
import {
  Clock,
  CheckCircle2,
  Scissors,
  PackageCheck,
  Truck,
  Check,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { OrderStatus } from '../../types/ecommerce';

interface OrderStatusTimelineProps {
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface StepConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const STANDARD_STEPS: StepConfig[] = [
  {
    id: 'pending_payment',
    label: 'Pending Payment',
    description: 'Order placed, awaiting checkout completion',
    icon: Clock,
  },
  {
    id: 'processing',
    label: 'Confirmed',
    description: 'Order confirmed & measurements assigned',
    icon: CheckCircle2,
  },
  {
    id: 'in_production',
    label: 'In Production',
    description: 'Atelier master tailors cutting & assembling',
    icon: Scissors,
  },
  {
    id: 'ready_for_dispatch',
    label: 'Ready for Dispatch',
    description: 'Passed final quality & press inspection',
    icon: PackageCheck,
  },
  {
    id: 'shipped',
    label: 'Dispatched',
    description: 'In transit with courier to your address',
    icon: Truck,
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'Safely delivered and received',
    icon: Check,
  },
];

const getStepIndex = (status: OrderStatus): number => {
  switch (status) {
    case 'pending_payment':
      return 0;
    case 'processing':
      return 1;
    case 'in_production':
      return 2;
    case 'ready_for_dispatch':
      return 3;
    case 'shipped':
      return 4;
    case 'delivered':
      return 5;
    default:
      return -1;
  }
};

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  status,
  createdAt,
  updatedAt,
}) => {
  const isTerminal = status === 'cancelled' || status === 'refunded';
  const currentStepIndex = getStepIndex(status);

  if (isTerminal) {
    const isCancelled = status === 'cancelled';
    return (
      <div
        id="order-status-terminal"
        className={`p-5 rounded-2xl border ${
          isCancelled
            ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
            : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isCancelled ? 'bg-zinc-800 text-zinc-400' : 'bg-rose-900/40 text-rose-400'
            }`}
          >
            {isCancelled ? (
              <XCircle className="w-5 h-5 text-zinc-400" />
            ) : (
              <RotateCcw className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-bold text-sm text-zinc-100 uppercase tracking-wider">
                {isCancelled ? 'Order Cancelled' : 'Order Refunded'}
              </h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isCancelled
                    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}
              >
                Terminal State
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {isCancelled
                ? 'This order was cancelled prior to fulfillment. Any reserved atelier fabric and inventory have been returned to available stock.'
                : 'Payment for this order has been refunded. The return and reconciliation processes are complete.'}
            </p>
            {updatedAt && (
              <p className="text-[11px] text-zinc-500 pt-1">
                Updated on {new Date(updatedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="order-status-timeline" className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-serif uppercase tracking-widest text-zinc-400 font-semibold">
          Order Status Journey
        </h4>
        <span className="text-[11px] text-amber-400 font-medium">
          Step {Math.max(1, currentStepIndex + 1)} of {STANDARD_STEPS.length}
        </span>
      </div>

      {/* Desktop / Tablet horizontal bar */}
      <div className="hidden md:grid grid-cols-6 gap-2">
        {STANDARD_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isUpcoming = idx > currentStepIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border flex flex-col items-center text-center space-y-2 transition relative ${
                isCurrent
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm'
                  : isCompleted
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                  : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  isCurrent
                    ? 'bg-amber-400 text-zinc-950 font-bold ring-4 ring-amber-400/20'
                    : isCompleted
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="space-y-0.5">
                <span
                  className={`text-[11px] font-semibold block leading-tight ${
                    isCurrent
                      ? 'text-amber-300 font-bold'
                      : isCompleted
                      ? 'text-zinc-200'
                      : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[9px] text-zinc-500 line-clamp-2 leading-tight">
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="md:hidden space-y-2 pl-2">
        {STANDARD_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isUpcoming = idx > currentStepIndex;
          const isLast = idx === STANDARD_STEPS.length - 1;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex items-start gap-3 pb-3 last:pb-0">
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                    idx < currentStepIndex ? 'bg-emerald-500/40' : 'bg-zinc-800'
                  }`}
                />
              )}

              {/* Step indicator node */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition ${
                  isCurrent
                    ? 'bg-amber-400 text-zinc-950 font-bold ring-4 ring-amber-400/20'
                    : isCompleted
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
              </div>

              {/* Step text info */}
              <div className="pt-0.5 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? 'text-amber-300 font-bold'
                        : isCompleted
                        ? 'text-zinc-200'
                        : 'text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
