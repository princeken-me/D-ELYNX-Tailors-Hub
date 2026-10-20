/**
 * D-ELYNX TAILORS HUB - BRAND DESIGN TOKENS & ECOSYSTEM CONFIGURATION
 * Centralized design tokens so brand values, palettes, and typography can be customized cleanly.
 */

export const BRAND_CONFIG = {
  name: 'D-ELYNX TAILORS HUB',
  shortName: 'D-ELYNX',
  tagline: 'One Platform. Every Fashion Opportunity.',
  positioning: 'The Global Digital Fashion Ecosystem',
  targetAudience: 'Designers, Tailors, Manufacturers, Buyers, Retailers, Fashion Academies, & Sartorial Investors',
  meta: {
    year: '2026',
    author: 'D-ELYNX Global Atelier',
  },
  tokens: {
    colors: {
      background: '#09090b', // Deep obsidian
      surface: '#121215',    // Matte carbon
      surfaceElevated: '#18181c', // Floating card surface
      border: '#27272a',     // High-definition hairline border
      borderAccent: '#c59b27', // Fine gold hairline
      primary: '#d4af37',    // Venetian Gold / Champagne
      primaryHover: '#e5c378',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
      accentSuccess: '#10b981',
      accentWarning: '#f59e0b',
      accentDanger: '#ef4444',
    },
    typography: {
      displayFont: 'Cinzel, serif',
      bodyFont: 'Plus Jakarta Sans, sans-serif',
    },
  },
  // The 12 Strategic Ecosystem Modules planned for D-ELYNX
  ecosystemModules: [
    {
      id: 'designer-hub',
      title: 'Designer Hub',
      description: 'Couture portfolios, lookbooks, pattern licensing, and collaboration ateliers.',
      status: 'Foundation Ready',
      phase: 2,
    },
    {
      id: 'manufacturer-marketplace',
      title: 'Manufacturer Marketplace',
      description: 'Direct factory sourcing, low-MOQ apparel factories, and sample development.',
      status: 'Foundation Ready',
      phase: 2,
    },
    {
      id: 'fashion-marketplace',
      title: 'Fashion Marketplace',
      description: 'Luxury ready-to-wear, bespoke garments, bespoke bridal, and haute couture.',
      status: 'Active Foundation',
      phase: 1,
    },
    {
      id: 'wholesale-b2b',
      title: 'Wholesale & B2B',
      description: 'Bulk order showrooms, retail buyer procurement, and trade credit terms.',
      status: 'Planned',
      phase: 3,
    },
    {
      id: 'fabric-trim-exchange',
      title: 'Fabric & Trim Exchange',
      description: 'Direct mills, deadstock luxury textiles, sustainable raw yardage.',
      status: 'Planned',
      phase: 3,
    },
    {
      id: 'ai-fashion-studio',
      title: 'AI Fashion Studio',
      description: 'Generative moodboards, 3D fitting renders, and virtual draping simulations.',
      status: 'Planned',
      phase: 4,
    },
    {
      id: 'learning-academy',
      title: 'Learning Academy',
      description: 'Masterclasses from Savile Row, bespoke tailoring certifications, apprentice network.',
      status: 'Planned',
      phase: 3,
    },
    {
      id: 'jobs-talent',
      title: 'Jobs & Talent',
      description: 'Patternmakers, seamstresses, creative directors, and atelier staffing.',
      status: 'Planned',
      phase: 3,
    },
    {
      id: 'logistics-hub',
      title: 'Logistics Hub',
      description: 'Cross-border garment freight, garment-on-hanger tracking, insured delivery.',
      status: 'Planned',
      phase: 4,
    },
    {
      id: 'fashion-incubator',
      title: 'Fashion Incubator',
      description: 'Venture capital backing, seed grants, fashion week runway sponsorships.',
      status: 'Planned',
      phase: 4,
    },
    {
      id: 'export-gateway',
      title: 'Export Gateway',
      description: 'Automated tariffs, customs clearing HS codes, and international VAT processing.',
      status: 'Planned',
      phase: 4,
    },
    {
      id: 'sustainability-hub',
      title: 'Sustainability Hub',
      description: 'Carbon-neutral certification, circular fabric recycling, and supply chain verification.',
      status: 'Planned',
      phase: 4,
    },
  ],
} as const;
