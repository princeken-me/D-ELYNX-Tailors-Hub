import React, { useState } from 'react';
import {
  GraduationCap,
  Scissors,
  Layers,
  Sparkles,
  BookOpen,
  Award,
  Globe,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from '../../lib/router/RouterContext';

interface AcademyDiscipline {
  id: string;
  title: string;
  level: 'Foundational' | 'Master Atelier' | 'Industrial Enterprise';
  duration: string;
  syllabus: string[];
  instructorTrack: string;
  summary: string;
}

const DISCIPLINES: AcademyDiscipline[] = [
  {
    id: 'fashion-design',
    title: 'Fashion Design & Silhouette Concepting',
    level: 'Foundational',
    duration: '8 Modules',
    syllabus: ['Historic Couturiers & Anatomy', 'Moodboarding & Drape Studies', 'Capsule Collection Architecture'],
    instructorTrack: 'Haute Couturiers from Paris & Lagos',
    summary: 'Master the art of translating abstract cultural narratives and historical motifs into high-impact contemporary fashion collections.',
  },
  {
    id: 'pattern-making',
    title: 'Bespoke Pattern Making & Dart Manipulation',
    level: 'Master Atelier',
    duration: '12 Modules',
    syllabus: ['Drafting the Master Torso Sloper', 'Contouring & French Bias Draping', 'Rotational Dart Manipulation'],
    instructorTrack: 'Savile Row Guild Cutters',
    summary: 'Rigorous technical pattern drafting for structured jackets, corsetry, and fluid skirts using both traditional paper and digital CAD.',
  },
  {
    id: 'garment-construction',
    title: 'Garment Construction & Tailoring Bench',
    level: 'Master Atelier',
    duration: '10 Modules',
    syllabus: ['Floating Horsehair Canvas Stitching', 'Pad-Stitched Lapels & Collars', 'Hand-Sewn Milanese Buttonholes'],
    instructorTrack: 'Master Tailors & Sartorial Houses',
    summary: 'The pinnacle of bespoke craft. Hand-canvassing, sleeve-setting, hand-felled linings, and iron molding shaping techniques.',
  },
  {
    id: 'industrial-sewing',
    title: 'Industrial Sewing & Machine Mastery',
    level: 'Foundational',
    duration: '6 Modules',
    syllabus: ['Lockstitch & Overlock Calibration', 'Differential Feed Adjustments', 'High-Speed Stitch Uniformity'],
    instructorTrack: 'Senior Factory Production Managers',
    summary: 'Professional machine operation for commercial garment consistency, tension balance, and specialized folder attachment workflows.',
  },
  {
    id: 'textile-technology',
    title: 'Textile Technology, Fibers & Weaves',
    level: 'Foundational',
    duration: '8 Modules',
    syllabus: ['Natural vs Synthetic Fiber Chemistry', 'Yarn Counts, Twill & Satin Weaves', 'Dyeing, Finishing & Shrinkage Controls'],
    instructorTrack: 'Kyoto & Biella Textile Mill Chemists',
    summary: 'In-depth textile science covering fiber origin, micron counts, tensile strength, yarn twist, and sustainability certifications.',
  },
  {
    id: 'fashion-illustration',
    title: 'Fashion Illustration & Digital Croquis',
    level: 'Foundational',
    duration: '6 Modules',
    syllabus: ['9-Head & 10-Head Proportion Stylization', 'Rendering Leather, Tweed & Sheer Silks', 'Vector Line Art for Line Sheets'],
    instructorTrack: 'Editorial Illustrators',
    summary: 'Expressive illustration methods for presentations, buyer line sheets, and lookbooks using pencil, watercolor, and digital stylus.',
  },
  {
    id: 'brand-marketing',
    title: 'Fashion Brand & Luxury Global Marketing',
    level: 'Industrial Enterprise',
    duration: '8 Modules',
    syllabus: ['Brand Positioning & Storytelling', 'Showroom Wholesaling & Pricing Margins', 'Digital Acquisition & Lookbook Campaigns'],
    instructorTrack: 'International Luxury Brand Directors',
    summary: 'Build a globally credible luxury fashion label with proven wholesale formulas, international distribution strategies, and PR narratives.',
  },
  {
    id: 'export-readiness',
    title: 'Export Readiness & International Trade',
    level: 'Industrial Enterprise',
    duration: '10 Modules',
    syllabus: ['Harmonized System (HS) Tariff Classification', 'Incoterms 2020 & Cross-Border Logistics', 'AGOA, AfCFTA & European Trade Compliance'],
    instructorTrack: 'Customs Brokers & Trade Facilitators',
    summary: 'Prepare African and emerging-market fashion ateliers to ship seamlessly to North America, the UK, Europe, and GCC countries.',
  },
  {
    id: 'ai-for-fashion',
    title: 'AI for Fashion & Computational Design',
    level: 'Master Atelier',
    duration: '6 Modules',
    syllabus: ['Prompt Engineering for Moodboard Generation', '3D CLO/Marvelous Garment Avatars', 'AI Tech-Pack & BOM Automation'],
    instructorTrack: 'Fashion-Tech Research Engineers',
    summary: 'Accelerate the creative cycle using neural synthesis for silhouettes, virtual fitting avatars, and rapid digital prototyping.',
  },
  {
    id: 'sustainability',
    title: 'Circular Fashion & Eco-Material Sourcing',
    level: 'Foundational',
    duration: '6 Modules',
    syllabus: ['Zero-Waste Pattern Layouts', 'Closed-Loop Organic & Recycled Textiles', 'Transparency Audits & Life Cycle Analysis'],
    instructorTrack: 'Sustainability Compliance Officers',
    summary: 'Eliminate cutting room scrap, adopt certified regenerative fabrics, and implement ethical labor auditing standards.',
  },
  {
    id: 'quality-control',
    title: 'Apparel Quality Control & Defect Auditing',
    level: 'Industrial Enterprise',
    duration: '6 Modules',
    syllabus: ['AQL 2.5 Sampling Standards', 'Seam Strength & Colorfastness Testing', 'Final Inspection Packaging Checklists'],
    instructorTrack: 'International Apparel QA Directors',
    summary: 'Rigorous quality management systems preventing factory rejections, shrinkage complaints, and customer returns.',
  },
  {
    id: 'lean-manufacturing',
    title: 'Lean Garment Manufacturing & CMT Systems',
    level: 'Industrial Enterprise',
    duration: '10 Modules',
    syllabus: ['Cellular Sewing Line Layouts', 'Standard Allowed Minute (SAM) Calculations', 'Bottleneck Reduction & Kanban Staging'],
    instructorTrack: 'Industrial Engineers & Factory Directors',
    summary: 'Optimize factory floor workflows, minimize WIP (work in progress), and achieve competitive CMT (Cut, Make, Trim) turnaround times.',
  },
];

export const AcademyPage: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<string>('All');
  const [selectedDiscipline, setSelectedDiscipline] = useState<AcademyDiscipline | null>(null);

  const levels = ['All', 'Foundational', 'Master Atelier', 'Industrial Enterprise'];

  const filtered = DISCIPLINES.filter((d) => {
    if (activeLevel === 'All') return true;
    return d.level === activeLevel;
  });

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Editorial Hero */}
      <section className="relative rounded-3xl overflow-hidden border border-[#27272A] bg-gradient-to-b from-[#121215] to-[#09090B] p-6 sm:p-12 md:p-16 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-[#D4AF37]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-amber-300 text-xs font-semibold uppercase tracking-widest font-serif">
            <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Sartorial Knowledge Center</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-100 uppercase leading-tight">
            D-ELYNX <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#D4AF37] to-[#C59B27]">Learning Academy</span>
          </h1>

          <p className="font-serif text-base sm:text-lg text-zinc-300 italic max-w-xl mx-auto">
            "Empowering the Next Generation of Global Fashion Masters, Cutters, and Factory Executives."
          </p>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            From heritage bespoke hand-canvassing and Savile Row pattern cutting to industrial lean apparel manufacturing and global export compliance, D-ELYNX Academy bridges centuries of artisanal technique with modern technology.
          </p>

          {/* Quick Metrics */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left border-t border-[#27272A]">
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <span className="font-serif text-lg font-bold text-zinc-100 block">12</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Curriculum Tracks</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <span className="font-serif text-lg font-bold text-[#D4AF37] block">Master</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Guild Mentorship</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <span className="font-serif text-lg font-bold text-zinc-100 block">Global</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Trade Standards</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <span className="font-serif text-lg font-bold text-emerald-400 block">Certified</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Ecosystem Badging</span>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Grid */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272A] pb-6">
          <div>
            <span className="text-xs uppercase font-serif tracking-widest text-[#D4AF37] font-semibold">
              Curriculum Catalog
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              Foundational & Master Disciplines
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Structured modules engineered for independent tailors, emerging designers, and factory production supervisors.
            </p>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveLevel(lvl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer min-h-[36px] ${
                  activeLevel === lvl
                    ? 'bg-[#D4AF37] text-zinc-950 font-semibold shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* 12 Disciplines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              id={`academy-card-${item.id}`}
              className="group p-6 rounded-2xl bg-[#121215] border border-[#27272A] hover:border-[#D4AF37]/50 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-black/50"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[9px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      item.level === 'Master Atelier'
                        ? 'bg-[#D4AF37]/15 text-amber-300 border border-[#D4AF37]/30'
                        : item.level === 'Industrial Enterprise'
                        ? 'bg-purple-950/70 text-purple-300 border border-purple-800/80'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {item.level}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{item.duration}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-zinc-100 group-hover:text-[#D4AF37] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                {/* Syllabus Highlights */}
                <div className="pt-3 border-t border-[#27272A] space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block font-sans">
                    Core Syllabus Focus
                  </span>
                  <ul className="space-y-1">
                    {item.syllabus.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                        <CheckCircle2 className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#27272A] flex items-center justify-between">
                <div className="text-[10px] text-zinc-500">
                  <span>Mentors: </span>
                  <span className="text-zinc-300">{item.instructorTrack}</span>
                </div>

                <button
                  onClick={() => setSelectedDiscipline(item)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-[#D4AF37] hover:text-zinc-950 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Syllabus Modal for Details */}
      {selectedDiscipline && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-[#121215] border border-[#27272A] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#D4AF37] font-serif">
                  {selectedDiscipline.level} Track
                </span>
                <h3 className="font-serif text-xl font-bold text-zinc-100 mt-1">
                  {selectedDiscipline.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDiscipline(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {selectedDiscipline.summary}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-serif">
                Full Module Syllabus ({selectedDiscipline.duration})
              </span>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                {selectedDiscipline.syllabus.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-200">
                    <span className="w-5 h-5 rounded-full bg-zinc-900 text-[#D4AF37] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">
                Guild certification included
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedDiscipline(null)}
              >
                Close Syllabus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
