import React, { useState } from 'react';
import { Globe, Users, ShieldCheck, MapPin, Search, Filter, Sparkles, Building2, GraduationCap } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface NetworkMember {
  id: string;
  name: string;
  role: string;
  city: string;
  country: string;
  specialty: string;
  verified: boolean;
  status: string;
}

const NETWORK_MEMBERS: NetworkMember[] = [
  {
    id: 'mem-1',
    name: 'Atelier Laurent',
    role: 'Master Tailor & Sartorial House',
    city: 'Paris',
    country: 'France',
    specialty: 'Hand-Canvassed Double-Breasted Suiting & Overcoats',
    verified: true,
    status: 'Accepting Bespoke Commissions',
  },
  {
    id: 'mem-2',
    name: 'Elena Rostova Studio',
    role: 'Haute Couture Designer',
    city: 'Milan',
    country: 'Italy',
    specialty: 'Silk Crepe Evening Gowns & Structural Corsetry',
    verified: true,
    status: 'Open for Collaboration',
  },
  {
    id: 'mem-3',
    name: 'Kyoto Textile Works Ltd',
    role: 'Textile Manufacturer & Mill',
    city: 'Kyoto',
    country: 'Japan',
    specialty: 'Organic Raw Silk, Indigo Dyed Twill, Kasuri Jacquard',
    verified: true,
    status: 'Supplying Sample Swatches',
  },
  {
    id: 'mem-4',
    name: 'Savile Craft Academy',
    role: 'Fashion Academy & Apprenticeship',
    city: 'London',
    country: 'United Kingdom',
    specialty: 'Masterclasses in Bespoke Pattern Drafting',
    verified: true,
    status: 'Fall Cohort Applications Open',
  },
  {
    id: 'mem-5',
    name: 'Nordic Apparel CMT Group',
    role: 'Garment Manufacturer',
    city: 'Porto',
    country: 'Portugal',
    specialty: 'Low-MOQ Sustainable Knitwear & Tailored Separates',
    verified: true,
    status: 'Production Lines Active',
  },
];

export const NetworkPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const filteredMembers = NETWORK_MEMBERS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.specialty.toLowerCase().includes(search.toLowerCase()) ||
      m.city.toLowerCase().includes(search.toLowerCase()) ||
      m.country.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-2 text-xs uppercase font-serif tracking-widest text-amber-400 font-semibold">
          <Globe className="w-3.5 h-3.5" />
          <span>Global Ecosystem Directory</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-zinc-100 mt-1">
          D-ELYNX Professional Fashion Network
        </h1>
        <p className="text-xs md:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
          Direct verified directory connecting haute couturiers, bespoke tailors, fabric mills, factories, and luxury retail procurement agents worldwide.
        </p>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-network-search"
            type="text"
            placeholder="Search ateliers, designers, manufacturers, or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="text-xs text-zinc-400 font-medium">
          Showing {filteredMembers.length} verified ecosystem partners
        </div>
      </div>

      {/* Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            id={`network-card-${member.id}`}
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-base font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span>{member.name}</span>
                    {member.verified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Verified by D-ELYNX" />
                    )}
                  </h3>
                  <p className="text-[11px] text-amber-400/90 font-medium font-serif mt-0.5">
                    {member.role}
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  {member.country}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                <span>{member.city}, {member.country}</span>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 text-xs text-zinc-300">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-0.5 font-semibold">
                  Specialty & Technique
                </span>
                <p className="line-clamp-2 leading-relaxed text-[11px]">{member.specialty}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {member.status}
              </span>
              <button
                id={`btn-connect-${member.id}`}
                onClick={() => alert(`Connection request initiated for ${member.name}. (Part of Phase 2 Networking Expansion).`)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-medium text-amber-400 transition cursor-pointer"
              >
                Inquire
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
