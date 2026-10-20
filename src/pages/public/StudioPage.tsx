import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Scissors,
  Cpu,
  Palette,
  Eye,
  Sliders,
  FileText,
  TrendingUp,
  Compass,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from '../../lib/router/RouterContext';

interface AICapability {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: 'Design & Creative' | 'Technical & Pattern' | 'Production & Commercial';
  status: 'In Development' | 'Private Beta' | 'Planned Phase 2';
  icon: React.ComponentType<{ className?: string }>;
}

const AI_CAPABILITIES: AICapability[] = [
  {
    id: 'sketch-gen',
    title: 'AI Sketch Generation',
    tagline: 'From descriptive prompt to haute couture silhouette sketches',
    description:
      'Generate structural croquis, drape concepts, and garment variations using diffusion models conditioned on fashion proportions and tailored garment anatomies.',
    category: 'Design & Creative',
    status: 'Private Beta',
    icon: Sparkles,
  },
  {
    id: 'pattern-draft',
    title: 'Parametric Pattern Drafting',
    tagline: 'Automated 2D block manipulation based on bespoke body measurements',
    description:
      'Translate three-dimensional silhouettes into accurate DXF-AAMA pattern pieces, complete with seam allowances, grainlines, and dart positioning.',
    category: 'Technical & Pattern',
    status: 'In Development',
    icon: Scissors,
  },
  {
    id: 'fabric-sim',
    title: 'Physics-Based Fabric Simulation',
    tagline: 'Real-time drape, shear, and tension modeling across textile weights',
    description:
      'Simulate how heavy wools, silks, linen, and cashmere respond dynamically on human avatars, avoiding physical sampling waste.',
    category: 'Technical & Pattern',
    status: 'In Development',
    icon: Layers,
  },
  {
    id: 'trend-pred',
    title: 'Sartorial Trend Prediction',
    tagline: 'Runway sentiment analysis and seasonal colorway intelligence',
    description:
      'Data-driven forecasting trained on international fashion weeks, bespoke couture movements, and consumer demand signals across Africa, Europe, and Asia.',
    category: 'Production & Commercial',
    status: 'Planned Phase 2',
    icon: TrendingUp,
  },
  {
    id: 'tech-packs',
    title: 'Automated Technical Packs',
    tagline: 'Factory-ready specification sheets generated in seconds',
    description:
      'Standardized BOM (Bill of Materials), stitch callouts, tolerance tables, and packaging instructions ready for CMT factories and industrial mills.',
    category: 'Technical & Pattern',
    status: 'Private Beta',
    icon: FileText,
  },
  {
    id: 'size-grading',
    title: 'Intelligent Size Grading',
    tagline: 'Multi-regional anthropometric grading curves without shape distortion',
    description:
      'Scale pattern blocks across UK, EU, US, and bespoke African proportion charts while maintaining the original designer silhouette proportions.',
    category: 'Technical & Pattern',
    status: 'In Development',
    icon: Sliders,
  },
  {
    id: 'virtual-fitting',
    title: 'Virtual Fitting Room',
    tagline: 'Interactive 3D avatar drape verification for bespoke commissions',
    description:
      'Empower remote customers and tailors to preview fit alterations, ease allowance, and hem lengths before fabric cutting begins.',
    category: 'Design & Creative',
    status: 'Private Beta',
    icon: Eye,
  },
  {
    id: 'runway-vis',
    title: 'Runway Lighting & Motion',
    tagline: 'Virtual catwalk simulations for seasonal lookbook debuts',
    description:
      'Render cinematic digital runway sequences with customized ambient lighting, editorial camera angles, and hyper-realistic fabric movement.',
    category: 'Design & Creative',
    status: 'Planned Phase 2',
    icon: Compass,
  },
  {
    id: 'color-palettes',
    title: 'Harmonic Colorway Extraction',
    tagline: 'Pantone-mapped seasonal palette generator and fabric swatches',
    description:
      'Extract coherent dye codes, contrast ratios, and seasonal harmonies directly from moodboards and artistic inspirations.',
    category: 'Design & Creative',
    status: 'In Development',
    icon: Palette,
  },
  {
    id: 'collection-plan',
    title: 'Collection Architecture Planner',
    tagline: 'Assortment balance and SKU mix optimization',
    description:
      'Structure capsule and full-line collections with balanced top/bottom ratios, core staples, statement outerwear, and accessory pairings.',
    category: 'Production & Commercial',
    status: 'Planned Phase 2',
    icon: Cpu,
  },
  {
    id: 'cost-estimation',
    title: 'Fabric Yield & Cost Estimation',
    tagline: 'Precise marker efficiency calculation and unit cost modeling',
    description:
      'Estimate linear meter consumption, cutting room waste percentage, and landed manufacturing costs prior to production commitment.',
    category: 'Production & Commercial',
    status: 'Private Beta',
    icon: TrendingUp,
  },
];

export const StudioPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const categories = ['All', 'Design & Creative', 'Technical & Pattern', 'Production & Commercial'];

  const filteredCapabilities = AI_CAPABILITIES.filter((cap) => {
    if (selectedFilter === 'All') return true;
    return cap.category === selectedFilter;
  });

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (waitlistEmail) {
      setWaitlistSubmitted(true);
      setTimeout(() => setWaitlistSubmitted(false), 5000);
      setWaitlistEmail('');
    }
  };

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Editorial Luxury Header */}
      <section className="relative rounded-3xl overflow-hidden border border-[#27272A] bg-gradient-to-b from-[#121215] to-[#09090B] p-6 sm:p-12 md:p-16 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-[#D4AF37]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-amber-300 text-xs font-semibold uppercase tracking-widest font-serif">
            <Cpu className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Future Fashion Workspace</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-100 uppercase leading-tight">
            D-ELYNX <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#D4AF37] to-[#C59B27]">AI Fashion Studio</span>
          </h1>

          <p className="font-serif text-base sm:text-lg text-zinc-300 italic max-w-xl mx-auto">
            "Design with the Power of AI. Precision Engineered for Haute Couture and Industrial Apparel."
          </p>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            The dedicated AI Fashion Studio is a core capability within the D-ELYNX roadmap. It unifies generative silhouette ideation, algorithmic pattern drafting, virtual fitting simulations, and automated factory-ready tech packs into a single high-fidelity creative cockpit.
          </p>

          {/* Early Access Notice */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#capabilities-section"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C358] hover:to-[#D4AF37] text-zinc-950 font-semibold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 transition-all cursor-pointer inline-flex items-center gap-2 min-h-[44px]"
            >
              <span>Explore Capability Suite</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              to="/marketplace"
              className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 min-h-[44px]"
            >
              <span>Browse Marketplace</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities Filter & Grid */}
      <section id="capabilities-section" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272A] pb-6">
          <div>
            <span className="text-xs uppercase font-serif tracking-widest text-[#D4AF37] font-semibold">
              Proprietary Suite
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              AI Fashion Capabilities
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Engineered exclusively for garment makers, creative directors, pattern cutters, and industrial mills.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer min-h-[36px] ${
                  selectedFilter === cat
                    ? 'bg-[#D4AF37] text-zinc-950 font-semibold shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCapabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.id}
                id={`ai-card-${cap.id}`}
                className="group p-6 rounded-2xl bg-[#121215] border border-[#27272A] hover:border-[#D4AF37]/50 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-black/50"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider font-sans ${
                        cap.status === 'Private Beta'
                          ? 'bg-[#D4AF37]/15 text-amber-300 border border-[#D4AF37]/30'
                          : cap.status === 'In Development'
                          ? 'bg-blue-950/70 text-blue-300 border border-blue-800/80'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {cap.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block font-sans">
                      {cap.category}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-zinc-100 mt-1 group-hover:text-[#D4AF37] transition-colors">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-amber-300/90 font-serif italic mt-1">
                      "{cap.tagline}"
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
                      {cap.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Platform Workspace</span>
                  </span>
                  <span className="text-[11px] font-medium text-[#D4AF37] group-hover:underline">
                    Learn Specs →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Atelier Waitlist Card */}
      <section className="rounded-3xl border border-[#27272A] bg-gradient-to-br from-[#121215] to-[#09090B] p-8 md:p-12 text-center max-w-3xl mx-auto space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-100">
            Request Studio Private Beta Access
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            Certified ateliers, master tailors, and garment manufacturers receive priority onboarding to early generative pattern & tech-pack modules.
          </p>
        </div>

        {waitlistSubmitted ? (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Thank you. Your atelier has been registered for the D-ELYNX AI Studio Beta queue.</span>
          </div>
        ) : (
          <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="atelier@fashionhouse.com"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/50"
            />
            <Button type="submit" size="md" variant="primary">
              Join Waitlist
            </Button>
          </form>
        )}
      </section>
    </div>
  );
};
