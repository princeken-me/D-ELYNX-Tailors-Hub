import React from 'react';
import { Shield, Sparkles, Layers, ChevronRight } from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { BRAND_CONFIG } from '../../config/brand.config';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 text-zinc-400 text-xs pb-24 md:pb-12 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand & Purpose */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-amber-500/30 flex items-center justify-center p-1">
                <img src="/icon.svg" alt="D-ELYNX" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <span className="font-serif text-base font-bold tracking-wider text-zinc-100 uppercase">
                {BRAND_CONFIG.name}
              </span>
            </div>
            <p className="text-zinc-300 font-serif text-xs italic">
              "{BRAND_CONFIG.tagline}"
            </p>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              {BRAND_CONFIG.positioning}. Connecting designers, tailors, manufacturers, buyers, retailers, fashion academies, and investors into a unified sartorial network.
            </p>
          </div>

          {/* Public & Marketplace */}
          <div>
            <h4 className="font-serif text-xs uppercase tracking-widest text-zinc-200 font-semibold mb-3">
              Marketplace Foundation
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/marketplace" className="hover:text-amber-400 transition-colors">
                  Haute Couture & Ready-to-Wear
                </Link>
              </li>
              <li>
                <Link to="/marketplace/category/bespoke-suits" className="hover:text-amber-400 transition-colors">
                  Bespoke Suiting & Tailoring
                </Link>
              </li>
              <li>
                <Link to="/marketplace/category/evening-gowns" className="hover:text-amber-400 transition-colors">
                  Atelier Evening Wear
                </Link>
              </li>
              <li>
                <Link to="/network" className="hover:text-amber-400 transition-colors">
                  Global Ecosystem Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Management Portals */}
          <div>
            <h4 className="font-serif text-xs uppercase tracking-widest text-zinc-200 font-semibold mb-3">
              Professional Portals
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/account" className="hover:text-amber-400 transition-colors">
                  Customer & Buyer Profile
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="hover:text-amber-400 transition-colors">
                  Order & Commission Tracking
                </Link>
              </li>
              <li>
                <Link to="/seller" className="hover:text-amber-400 transition-colors">
                  Seller & Atelier Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Scalability Assurance */}
          <div className="space-y-3">
            <h4 className="font-serif text-xs uppercase tracking-widest text-zinc-200 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Phase 1 Architecture</span>
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Mobile-First PWA built with React, TypeScript, and Supabase backend foundation. The core schema is engineered to cleanly adopt all 12 planned ecosystem modules.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>PostgreSQL & RLS Schema Ready</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500">
          <p>© {BRAND_CONFIG.meta.year} {BRAND_CONFIG.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Progressive Web App</span>
            <span>•</span>
            <span>Supabase Architecture</span>
            <span>•</span>
            <span>Production Grade Foundation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
