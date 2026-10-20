import React, { useState } from 'react';
import { UserCheck, Shield, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfessionalRole } from '../../types/user';

const ROLES: { id: ProfessionalRole; label: string; badge: string; desc: string }[] = [
  { id: 'customer', label: 'Bespoke Client / Buyer', badge: 'Client', desc: 'Browses luxury catalogues, commissions tailor-made pieces' },
  { id: 'designer', label: 'Fashion Designer', badge: 'Designer', desc: 'Publishes patterns, seasonal collections, and couture lookbooks' },
  { id: 'tailor', label: 'Master Tailor / Sartorialist', badge: 'Atelier', desc: 'Takes bespoke appointments, accepts alteration & bespoke requests' },
  { id: 'manufacturer', label: 'Garment Manufacturer', badge: 'Factory', desc: 'Accepts bulk CMT orders, sample tech-packs, production runs' },
  { id: 'buyer_retailer', label: 'Retail Buyer', badge: 'Procurement', desc: 'Wholesale orders, multi-brand boutique purchasing' },
  { id: 'seller', label: 'Brand / Boutique Seller', badge: 'Merchant', desc: 'Manages products, inventories, and customer shipments' },
  { id: 'instructor_mentor', label: 'Master Instructor', badge: 'Academy', desc: 'Curates tailoring courses, masterclasses, and apprentice mentorship' },
  { id: 'moderator', label: 'Ecosystem Moderator', badge: 'Trust & Safety', desc: 'Reviews atelier verifications and textile quality disputes' },
  { id: 'admin', label: 'Administrator', badge: 'Admin', desc: 'Control Center & Management, front-end content moderation & systemic governance' },
];

export const RoleSwitcher: React.FC = () => {
  const { profile, setDemoProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Unify super_admin with admin
  const currentRole = profile?.professional_role === 'super_admin' ? 'admin' : (profile?.professional_role || 'designer');
  const activeRoleObj = ROLES.find((r) => r.id === currentRole) || ROLES[1];
  const isAdmin = currentRole === 'admin';

  return (
    <div className="relative inline-block text-left" id="role-switcher-container">
      <button
        id="btn-active-role-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/70 hover:border-amber-500/50 text-xs text-zinc-200 transition cursor-pointer"
        title="Switch professional identity context"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-medium">{activeRoleObj.badge}</span>
        <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="role-switcher-dropdown"
            className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2.5 z-50 text-left backdrop-blur-xl space-y-2"
          >
            <div className="px-2.5 py-2 border-b border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 uppercase tracking-wider font-serif">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Professional Identity</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Switch identity to inspect role-specific UI and authorization:
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto py-1 divide-y divide-zinc-800/40">
              {ROLES.map((role) => {
                const isSelected = role.id === currentRole;
                return (
                  <button
                    key={role.id}
                    id={`btn-select-role-${role.id}`}
                    onClick={() => {
                      setDemoProfile(role.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium">{role.label}</span>
                        <span className="px-1.5 py-0.2 text-[9px] rounded uppercase font-semibold bg-zinc-800 text-zinc-400">
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{role.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
