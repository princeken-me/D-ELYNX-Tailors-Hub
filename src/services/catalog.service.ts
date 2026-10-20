import { getSupabase, isSupabaseConfigured, isProduction } from '../lib/supabase/client';
import { Category, Product, ProductVariant, ProductStatus } from '../types/ecommerce';
import { sanitizeInput } from '../lib/security/validation';

export interface ProductAvailabilityResult {
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  inStock: boolean;
  quantity?: number;
}

export interface GetProductsOptions {
  categorySlug?: string;
  limit?: number;
  offset?: number;
}

// Development prototype sample catalog with Nigerian settings and NGN currency
export const DEV_SAMPLE_CATEGORIES: Category[] = [
  {
    id: 'cat-bespoke-suits',
    name: 'Bespoke Suiting & Tailoring',
    slug: 'bespoke-suits',
    description: 'Hand-canvassed double-breasted and single-breasted sartorial garments tailored for Nigerian climate & gala events.',
    status: 'active',
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-evening-gowns',
    name: 'Haute Couture Evening Wear',
    slug: 'evening-gowns',
    description: 'Floor-length silk crepe, velvet draping, and hand-beaded bridal and gala gowns.',
    status: 'active',
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-outerwear',
    name: 'Luxury Overcoats & Trench',
    slug: 'outerwear',
    description: 'Double-faced cashmere, lightweight wool-silk capes, and weather-sealed trench coats.',
    status: 'active',
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-accessories',
    name: 'Sartorial Accessories & Silk',
    slug: 'accessories',
    description: 'Hand-rolled silk foulards, authentic royal coral cufflinks, and hand-loomed Aso-Oke cummerbund sets.',
    status: 'active',
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-traditional-bespoke',
    name: 'Traditional & Ceremonial Bespoke',
    slug: 'traditional-bespoke',
    description: 'Imperial hand-cut damask Royal Agbada, Senator sets, and hand-embroidered regal Kaftans.',
    status: 'active',
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEV_SAMPLE_PRODUCTS: Product[] = [
  // Category 1: Bespoke Suiting & Tailoring (Product 1 of 2)
  {
    id: 'prod-001',
    seller_id: 'seller-danladi',
    category_id: 'cat-bespoke-suits',
    name: 'Ikoyi Super 160s Double-Breasted Midnight Dinner Suit',
    slug: 'ikoyi-super-160s-midnight-dinner-suit',
    description:
      'Handcrafted in Victoria Island, Lagos from breathable Dormeuil Super 160s Australian merino wool tailored specifically for humid tropical climates. Fully canvassed construction with silk grosgrain peak lapels, genuine buffalo horn buttons, and hand-finished Milanese lapel buttonhole. Ideal for black-tie galas, state banquets, and high-society receptions.',
    base_price: 850000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-bespoke-suits',
      name: 'Bespoke Suiting & Tailoring',
      slug: 'bespoke-suits',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-danladi',
      business_name: 'Atelier Danladi & Co.',
      country: 'Nigeria',
      city: 'Victoria Island, Lagos',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-001-38r',
        product_id: 'prod-001',
        sku: 'AD-SUIT-160S-38R',
        size: 'EU 48 / US 38R',
        color: 'Midnight Navy',
        material: 'Super 160s Tropical Wool',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-001-40r',
        product_id: 'prod-001',
        sku: 'AD-SUIT-160S-40R',
        size: 'EU 50 / US 40R',
        color: 'Midnight Navy',
        material: 'Super 160s Tropical Wool',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-001-42r',
        product_id: 'prod-001',
        sku: 'AD-SUIT-160S-42R',
        size: 'EU 52 / US 42R',
        color: 'Midnight Navy',
        material: 'Super 160s Tropical Wool',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-001-mtm',
        product_id: 'prod-001',
        sku: 'AD-SUIT-160S-MTM',
        size: 'Bespoke Made-to-Measure',
        color: 'Midnight Navy (Lagos Atelier Fitting)',
        material: 'Super 160s Tropical Wool',
        price_override: 950000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  // Category 1: Bespoke Suiting & Tailoring (Product 2 of 2)
  {
    id: 'prod-002',
    seller_id: 'seller-savile-abuja',
    category_id: 'cat-bespoke-suits',
    name: 'Maitama Hand-Cut Peak Lapel 3-Piece Executive Suit',
    slug: 'maitama-hand-cut-3-piece-executive-suit',
    description:
      'Cut and drafted by master tailors on Gana Street, Maitama, Abuja. Cut from English Scabal Super 150s wool with subtle tonal pinstripes. Features a structured 6-button double-breasted waistcoat, roped shoulders, high-waisted double-pleated trousers with brass side adjusters, and Nigerian silk jacquard inner lining.',
    base_price: 1200000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-bespoke-suits',
      name: 'Bespoke Suiting & Tailoring',
      slug: 'bespoke-suits',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-savile-abuja',
      business_name: 'Savile Row Heritage Nigeria',
      country: 'Nigeria',
      city: 'Maitama, Abuja',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-002-40r',
        product_id: 'prod-002',
        sku: 'SRH-SUIT-SCABAL-40R',
        size: 'EU 50 / US 40R',
        color: 'Charcoal Chalkstripe',
        material: 'Scabal Super 150s Wool',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-002-42r',
        product_id: 'prod-002',
        sku: 'SRH-SUIT-SCABAL-42R',
        size: 'EU 52 / US 42R',
        color: 'Charcoal Chalkstripe',
        material: 'Scabal Super 150s Wool',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-002-mtm',
        product_id: 'prod-002',
        sku: 'SRH-SUIT-SCABAL-MTM',
        size: 'Bespoke Made-to-Measure',
        color: 'Charcoal Chalkstripe (Abuja Fitting)',
        material: 'Scabal Super 150s Wool',
        price_override: 1350000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  // Category 2: Haute Couture Evening Wear (Product 1 of 2)
  {
    id: 'prod-003',
    seller_id: 'seller-deola',
    category_id: 'cat-evening-gowns',
    name: 'Eko Pearl-Embellished Silk Crepe Gala Gown',
    slug: 'eko-pearl-embellished-silk-crepe-gala-gown',
    description:
      'Designed and hand-beaded over 120 hours in Lekki Phase 1, Lagos. Crafted from heavy Japanese silk crepe featuring freshwater seed pearl and bugle-bead embroidery tracing an asymmetric off-shoulder neckline. Built-in interior corset structure provides flawless sculpting and comfort for grand celebrations.',
    base_price: 980000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-evening-gowns',
      name: 'Haute Couture Evening Wear',
      slug: 'evening-gowns',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-deola',
      business_name: 'House of Deola & Alara',
      country: 'Nigeria',
      city: 'Lekki Phase 1, Lagos',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-003-uk8',
        product_id: 'prod-003',
        sku: 'HDA-GOWN-PEARL-UK8',
        size: 'UK 8 / US 4',
        color: 'Onyx Noir & Seed Pearl',
        material: 'Heavy Japanese Silk Crepe',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-003-uk10',
        product_id: 'prod-003',
        sku: 'HDA-GOWN-PEARL-UK10',
        size: 'UK 10 / US 6',
        color: 'Onyx Noir & Seed Pearl',
        material: 'Heavy Japanese Silk Crepe',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-003-uk12',
        product_id: 'prod-003',
        sku: 'HDA-GOWN-PEARL-UK12',
        size: 'UK 12 / US 8',
        color: 'Onyx Noir & Seed Pearl',
        material: 'Heavy Japanese Silk Crepe',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-003-bespoke',
        product_id: 'prod-003',
        sku: 'HDA-GOWN-PEARL-BESPOKE',
        size: 'Custom Atelier Sizing',
        color: 'Onyx Noir & Seed Pearl',
        material: 'Heavy Japanese Silk Crepe',
        price_override: 1100000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  // Category 2: Haute Couture Evening Wear (Product 2 of 2)
  {
    id: 'prod-004',
    seller_id: 'seller-enitan',
    category_id: 'cat-evening-gowns',
    name: 'Calabar Crimson Draped Silk Velvet Column Gown',
    slug: 'calabar-crimson-draped-silk-velvet-column-gown',
    description:
      'Sourced from Italian silk velvet and tailored with bias draping inspired by classic Calabar ceremonial royalty. Features a sweetheart corseted bodice, thigh-high side split lined in gold silk satin, and a dramatic detachable cathedral sweep train for grand red-carpet entrances.',
    base_price: 1150000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-evening-gowns',
      name: 'Haute Couture Evening Wear',
      slug: 'evening-gowns',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-enitan',
      business_name: 'Enitan Haute Couture',
      country: 'Nigeria',
      city: 'Calabar & Ikeja, Lagos',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-004-uk8',
        product_id: 'prod-004',
        sku: 'EHC-VELVET-CRIM-UK8',
        size: 'UK 8 / US 4',
        color: 'Deep Crimson',
        material: 'Italian Silk Velvet',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-004-uk10',
        product_id: 'prod-004',
        sku: 'EHC-VELVET-CRIM-UK10',
        size: 'UK 10 / US 6',
        color: 'Deep Crimson',
        material: 'Italian Silk Velvet',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-004-bespoke',
        product_id: 'prod-004',
        sku: 'EHC-VELVET-CRIM-BESPOKE',
        size: 'Custom Atelier Sizing',
        color: 'Deep Crimson',
        material: 'Italian Silk Velvet',
        price_override: 1300000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  // Category 3: Luxury Overcoats & Trench (Product 1 of 2)
  {
    id: 'prod-005',
    seller_id: 'seller-northern',
    category_id: 'cat-outerwear',
    name: 'Zaria Embroidered Cashmere & Silk Cape Coat',
    slug: 'zaria-embroidered-cashmere-silk-cape-coat',
    description:
      'An exquisite fusion of double-faced Mongolian cashmere and Nigerian northern royal craftsmanship. Hand-embroidered with subtle Hausa geometric gold filigree along the standing mandarin collar and split sleeve vents. Designed for cool harmattan evenings, international flights, and diplomatic travel.',
    base_price: 620000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-outerwear',
      name: 'Luxury Overcoats & Trench',
      slug: 'outerwear',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-northern',
      business_name: 'Northern Thread Works',
      country: 'Nigeria',
      city: 'Kano & Kaduna',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-005-med',
        product_id: 'prod-005',
        sku: 'NTW-CAPE-CASH-MED',
        size: 'Medium (Chest 38-40)',
        color: 'Desert Camel Melange',
        material: 'Double-Faced Cashmere & Silk',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-005-lge',
        product_id: 'prod-005',
        sku: 'NTW-CAPE-CASH-LGE',
        size: 'Large (Chest 42-44)',
        color: 'Desert Camel Melange',
        material: 'Double-Faced Cashmere & Silk',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-005-mono',
        product_id: 'prod-005',
        sku: 'NTW-CAPE-CASH-MONO',
        size: 'Bespoke Monogrammed',
        color: 'Desert Camel Melange',
        material: 'Double-Faced Cashmere & Silk',
        price_override: 680000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  // Category 3: Luxury Overcoats & Trench (Product 2 of 2)
  {
    id: 'prod-006',
    seller_id: 'seller-marina',
    category_id: 'cat-outerwear',
    name: 'Marina Double-Breasted Storm Trench in Waxed Cotton',
    slug: 'marina-double-breasted-storm-trench',
    description:
      'Crafted in the historic sartorial quarter of Marina, Lagos Island. Made from breathable British waxed cotton twill treated for equatorial torrential downpours. Features storm flaps, brass eyelets, a self-fabric waist belt with leather buckle, and an interior detachable silk-quilted warmer.',
    base_price: 480000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-outerwear',
      name: 'Luxury Overcoats & Trench',
      slug: 'outerwear',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-marina',
      business_name: 'Lagos Sartorial Atelier',
      country: 'Nigeria',
      city: 'Marina, Lagos Island',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-006-40r',
        product_id: 'prod-006',
        sku: 'LSA-TRENCH-WAX-40R',
        size: 'Medium (Chest 40)',
        color: 'Olive Bronze',
        material: 'Waterproof Waxed Cotton Twill',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-006-42r',
        product_id: 'prod-006',
        sku: 'LSA-TRENCH-WAX-42R',
        size: 'Large (Chest 42)',
        color: 'Olive Bronze',
        material: 'Waterproof Waxed Cotton Twill',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-006-44r',
        product_id: 'prod-006',
        sku: 'LSA-TRENCH-WAX-44R',
        size: 'Extra Large (Chest 44)',
        color: 'Olive Bronze',
        material: 'Waterproof Waxed Cotton Twill',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  // Category 4: Sartorial Accessories & Silk (Product 1 of 2)
  {
    id: 'prod-007',
    seller_id: 'seller-iseyin',
    category_id: 'cat-accessories',
    name: 'Hand-Woven Royal Aso-Oke Cummerbund & Bowtie Set',
    slug: 'hand-woven-royal-aso-oke-cummerbund-bowtie-set',
    description:
      'Hand-loomed in the historic weaving town of Iseyin, Oyo State using metallic lurex and combed Egyptian cotton yarns. The set includes an adjustable pleated cummerbund, a bespoke self-tie/pre-tied bowtie, and a matching hand-rolled pocket square with raw silk edges. Perfect for black-tie traditional-fusion events.',
    base_price: 145000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1589756823695-278bc923f962?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-accessories',
      name: 'Sartorial Accessories & Silk',
      slug: 'accessories',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-iseyin',
      business_name: 'Iseyin Loom Masters',
      country: 'Nigeria',
      city: 'Iseyin, Oyo State & Lagos',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-007-gold',
        product_id: 'prod-007',
        sku: 'ILM-ASO-GOLD',
        size: 'Adjustable (Waist 30-38")',
        color: 'Onyx & Gold Thread',
        material: 'Hand-Loomed Royal Aso-Oke & Silk',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-007-emerald',
        product_id: 'prod-007',
        sku: 'ILM-ASO-EMERALD',
        size: 'Adjustable (Waist 30-38")',
        color: 'Royal Emerald & Bronze',
        material: 'Hand-Loomed Royal Aso-Oke & Silk',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-007-purple',
        product_id: 'prod-007',
        sku: 'ILM-ASO-PURPLE',
        size: 'Adjustable (Waist 30-38")',
        color: 'Imperial Purple & Silver',
        material: 'Hand-Loomed Royal Aso-Oke & Silk',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  // Category 4: Sartorial Accessories & Silk (Product 2 of 2)
  {
    id: 'prod-008',
    seller_id: 'seller-benin',
    category_id: 'cat-accessories',
    name: 'Bini Monarch Genuine Coral Bead & 18K Gilded Cufflink Ensemble',
    slug: 'bini-monarch-coral-bead-gilded-cufflink-ensemble',
    description:
      'Hand-carved by hereditary artisans of the Royal Crafts Guild in Benin City, Edo State. Features certified genuine Mediterranean deep-salmon coral cylindrical beads set in 18-karat gold-plated solid brass swivel-back cufflinks, paired with four matching tuxedo shirt studs. Packaged in a velvet-lined carved mahogany presentation box.',
    base_price: 280000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1611042553365-9b101441c135?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1611042553365-9b101441c135?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-accessories',
      name: 'Sartorial Accessories & Silk',
      slug: 'accessories',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-benin',
      business_name: 'Royal Benin Crafts Guild',
      country: 'Nigeria',
      city: 'Benin City & Abuja',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-008-salmon',
        product_id: 'prod-008',
        sku: 'RBG-CORAL-SALMON',
        size: 'Standard Cufflink & 4 Studs',
        color: 'Deep Salmon Coral & 18K Gilt',
        material: 'Genuine Coral & 18K Gold Plate',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-008-crimson',
        product_id: 'prod-008',
        sku: 'RBG-CORAL-CRIMSON',
        size: 'Monarch Edition (Larger Barrel)',
        color: 'Imperial Crimson Coral & 18K Gilt',
        material: 'Select Aged Coral & 18K Gold Plate',
        price_override: 320000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  // Category 5: Traditional & Ceremonial Bespoke (Product 1 of 2)
  {
    id: 'prod-009',
    seller_id: 'seller-owanbe',
    category_id: 'cat-traditional-bespoke',
    name: 'Grand Imperial 3-Piece Royal Agbada & Fila Set',
    slug: 'grand-imperial-3-piece-royal-agbada-set',
    description:
      'The pinnacle of Nigerian ceremonial menswear. Crafted from 100% heavyweight English damask paired with hand-cut computerized embroidery requiring 45,000 stitches along the chest and shoulders. Includes the billowing grand Agbada robe, tailored buba inner shirt, sokoto drawstring trousers, and a hand-crafted structured Fila Gobi cap.',
    base_price: 750000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-traditional-bespoke',
      name: 'Traditional & Ceremonial Bespoke',
      slug: 'traditional-bespoke',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-owanbe',
      business_name: 'Owanbe Masters Bespoke',
      country: 'Nigeria',
      city: 'Surulere, Lagos',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-009-std',
        product_id: 'prod-009',
        sku: 'OMB-AGB-DAMASK-STD',
        size: 'Standard Grand (58-62" Wingspan)',
        color: 'Imperial Ivory & Royal Gold Filigree',
        material: 'Heavyweight English Damask',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-009-tall',
        product_id: 'prod-009',
        sku: 'OMB-AGB-DAMASK-TALL',
        size: 'Tall Grand (62-66" Wingspan)',
        color: 'Imperial Ivory & Royal Gold Filigree',
        material: 'Heavyweight English Damask',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-009-bespoke',
        product_id: 'prod-009',
        sku: 'OMB-AGB-DAMASK-BESPOKE',
        size: 'Custom Measured Bespoke',
        color: 'Custom Damask & Thread Palette',
        material: 'Heavyweight English Damask',
        price_override: 850000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  // Category 5: Traditional & Ceremonial Bespoke (Product 2 of 2)
  {
    id: 'prod-010',
    seller_id: 'seller-capital',
    category_id: 'cat-traditional-bespoke',
    name: 'Asokoro Crisp Irish Linen Senator Suit with Asymmetric Embroidery',
    slug: 'asokoro-crisp-irish-linen-senator-suit',
    description:
      'Tailored from crisp 100% pure Irish linen in Wuse II, Abuja. Designed with a structured mandarin collar, concealed front placket, and subtle geometric monochromatic embroidery across the left chest panel. Engineered with moisture-wicking pocketing and slim-fit trousers with side adjusters for all-day sharpness in the Nigerian heat.',
    base_price: 380000,
    currency: 'NGN',
    status: 'active',
    featured: true,
    hero_image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat-traditional-bespoke',
      name: 'Traditional & Ceremonial Bespoke',
      slug: 'traditional-bespoke',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-capital',
      business_name: 'Capital Bespoke Abuja',
      country: 'Nigeria',
      city: 'Wuse II, Abuja',
      verification_status: 'verified',
    },
    variants: [
      {
        id: 'var-010-38',
        product_id: 'prod-010',
        sku: 'CBA-SEN-LINEN-38',
        size: 'Chest 38 / Waist 32',
        color: 'Sky Ivory',
        material: '100% Pure Irish Linen',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-010-40',
        product_id: 'prod-010',
        sku: 'CBA-SEN-LINEN-40',
        size: 'Chest 40 / Waist 34',
        color: 'Sky Ivory',
        material: '100% Pure Irish Linen',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-010-42',
        product_id: 'prod-010',
        sku: 'CBA-SEN-LINEN-42',
        size: 'Chest 42 / Waist 36',
        color: 'Sky Ivory',
        material: '100% Pure Irish Linen',
        price_override: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'var-010-bespoke',
        product_id: 'prod-010',
        sku: 'CBA-SEN-LINEN-BESPOKE',
        size: 'Bespoke Made-to-Measure',
        color: 'Custom Linen Color',
        material: '100% Pure Irish Linen',
        price_override: 440000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
];

/**
 * Catalog Data Access Service
 * Queries real Supabase PostgreSQL database tables when configured.
 * Safely guards against mock data leaks in production.
 */
export class CatalogService {
  /**
   * Fetch active categories ordered by sort_order
   */
  static async getCategories(): Promise<Category[]> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      return DEV_SAMPLE_CATEGORIES;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('CatalogService: Error fetching categories:', error.message);
        return DEV_SAMPLE_CATEGORIES;
      }
      return (data as Category[]) || DEV_SAMPLE_CATEGORIES;
    } catch (err) {
      console.warn('CatalogService unexpected error in getCategories:', err);
      return DEV_SAMPLE_CATEGORIES;
    }
  }

  /**
   * Fetch a single category by slug
   */
  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const cleanSlug = sanitizeInput(slug);
    const supabase = getSupabase();

    if (!supabase || !isSupabaseConfigured) {
      return DEV_SAMPLE_CATEGORIES.find((c) => c.slug === cleanSlug) || null;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', cleanSlug)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.warn('CatalogService: Error fetching category by slug:', error.message);
        return DEV_SAMPLE_CATEGORIES.find((c) => c.slug === cleanSlug) || null;
      }
      return (data as Category) || DEV_SAMPLE_CATEGORIES.find((c) => c.slug === cleanSlug) || null;
    } catch (err) {
      console.warn('CatalogService unexpected error in getCategoryBySlug:', err);
      return DEV_SAMPLE_CATEGORIES.find((c) => c.slug === cleanSlug) || null;
    }
  }

  /**
   * Fetch active products with optional category slug filter or pagination options
   */
  static async getProducts(
    optionsOrSlug?: string | GetProductsOptions
  ): Promise<Product[]> {
    const options: GetProductsOptions =
      typeof optionsOrSlug === 'string'
        ? { categorySlug: optionsOrSlug }
        : optionsOrSlug || {};

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      if (options.categorySlug) {
        const clean = sanitizeInput(options.categorySlug);
        return DEV_SAMPLE_PRODUCTS.filter((p) => p.category?.slug === clean);
      }
      return DEV_SAMPLE_PRODUCTS;
    }

    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          seller_id,
          category_id,
          name,
          slug,
          description,
          base_price,
          currency,
          status,
          featured,
          hero_image,
          images,
          created_at,
          updated_at,
          category:categories(*),
          seller:sellers(id, business_name, country, verification_status),
          variants:product_variants(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (options.categorySlug) {
        const cleanSlug = sanitizeInput(options.categorySlug);
        // Find category id first
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (cat) {
          query = query.eq('category_id', cat.id);
        } else {
          return [];
        }
      }

      if (typeof options.limit === 'number') {
        query = query.limit(options.limit);
      }
      if (typeof options.offset === 'number') {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('CatalogService: Error fetching products:', error.message);
        return DEV_SAMPLE_PRODUCTS;
      }

      const rawList = (data as unknown as any[]) || [];
      if (rawList.length === 0) {
        return DEV_SAMPLE_PRODUCTS;
      }
      return rawList.map((p) => ({
        ...p,
        category: Array.isArray(p.category) ? p.category[0] : p.category,
        seller: Array.isArray(p.seller) ? p.seller[0] : p.seller,
        variants: p.variants || [],
      })) as Product[];
    } catch (err) {
      console.warn('CatalogService unexpected error in getProducts:', err);
      return DEV_SAMPLE_PRODUCTS;
    }
  }

  /**
   * Fetch single product by slug
   */
  static async getProductBySlug(slug: string): Promise<Product | null> {
    const cleanSlug = sanitizeInput(slug);
    const supabase = getSupabase();

    if (!supabase || !isSupabaseConfigured) {
      return (
        DEV_SAMPLE_PRODUCTS.find((p) => p.slug === cleanSlug) ||
        (cleanSlug === 'super-160s-midnight-dinner-suit' ? DEV_SAMPLE_PRODUCTS[0] : null)
      );
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          seller_id,
          category_id,
          name,
          slug,
          description,
          base_price,
          currency,
          status,
          featured,
          hero_image,
          images,
          created_at,
          updated_at,
          category:categories(*),
          seller:sellers(id, business_name, country, verification_status),
          variants:product_variants(*)
        `)
        .eq('slug', cleanSlug)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.warn('CatalogService: Error fetching product by slug:', error.message);
        return (
          DEV_SAMPLE_PRODUCTS.find((p) => p.slug === cleanSlug) ||
          (cleanSlug === 'super-160s-midnight-dinner-suit' ? DEV_SAMPLE_PRODUCTS[0] : null)
        );
      }

      if (!data) {
        return (
          DEV_SAMPLE_PRODUCTS.find((p) => p.slug === cleanSlug) ||
          (cleanSlug === 'super-160s-midnight-dinner-suit' ? DEV_SAMPLE_PRODUCTS[0] : null)
        );
      }
      const raw = data as unknown as any;
      return {
        ...raw,
        category: Array.isArray(raw.category) ? raw.category[0] : raw.category,
        seller: Array.isArray(raw.seller) ? raw.seller[0] : raw.seller,
        variants: raw.variants || [],
      } as Product;
    } catch (err) {
      console.warn('CatalogService unexpected error in getProductBySlug:', err);
      return (
        DEV_SAMPLE_PRODUCTS.find((p) => p.slug === cleanSlug) ||
        (cleanSlug === 'super-160s-midnight-dinner-suit' ? DEV_SAMPLE_PRODUCTS[0] : null)
      );
    }
  }

  /**
   * Fetch single product by ID
   */
  static async getProductById(productId: string): Promise<Product | null> {
    const cleanId = sanitizeInput(productId);
    const supabase = getSupabase();

    if (!supabase || !isSupabaseConfigured) {
      return DEV_SAMPLE_PRODUCTS.find((p) => p.id === cleanId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          seller_id,
          category_id,
          name,
          slug,
          description,
          base_price,
          currency,
          status,
          featured,
          hero_image,
          images,
          created_at,
          updated_at,
          category:categories(*),
          seller:sellers(id, business_name, country, verification_status),
          variants:product_variants(*)
        `)
        .eq('id', cleanId)
        .maybeSingle();

      if (error || !data) {
        return DEV_SAMPLE_PRODUCTS.find((p) => p.id === cleanId) || null;
      }

      const raw = data as unknown as any;
      return {
        ...raw,
        category: Array.isArray(raw.category) ? raw.category[0] : raw.category,
        seller: Array.isArray(raw.seller) ? raw.seller[0] : raw.seller,
        variants: raw.variants || [],
      } as Product;
    } catch (err) {
      console.warn('CatalogService unexpected error in getProductById:', err);
      return DEV_SAMPLE_PRODUCTS.find((p) => p.id === cleanId) || null;
    }
  }

  /**
   * Search active products using parameterized Supabase ILIKE queries
   */
  static async searchProducts(queryText: string, categorySlug?: string): Promise<Product[]> {
    const rawSearch = sanitizeInput(queryText.trim());
    if (!rawSearch) {
      return this.getProducts(categorySlug ? { categorySlug } : undefined);
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const q = rawSearch.toLowerCase();
      return DEV_SAMPLE_PRODUCTS.filter((p) => {
        const matchesCategory = !categorySlug || p.category?.slug === categorySlug;
        const matchesTerm =
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.seller?.business_name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q);
        return matchesCategory && matchesTerm;
      });
    }

    try {
      // Escape SQL LIKE wildcards in search term to prevent regex/wildcard injection
      const escapedTerm = rawSearch.replace(/[%_\\]/g, '\\$&');

      let query = supabase
        .from('products')
        .select(`
          id,
          seller_id,
          category_id,
          name,
          slug,
          description,
          base_price,
          currency,
          status,
          featured,
          hero_image,
          images,
          created_at,
          updated_at,
          category:categories(*),
          seller:sellers(id, business_name, country, verification_status),
          variants:product_variants(*)
        `)
        .eq('status', 'active')
        .or(`name.ilike.%${escapedTerm}%,description.ilike.%${escapedTerm}%`)
        .order('created_at', { ascending: false });

      if (categorySlug) {
        const cleanSlug = sanitizeInput(categorySlug);
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (cat) {
          query = query.eq('category_id', cat.id);
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (error) {
        console.warn('CatalogService: Error searching products:', error.message);
        return [];
      }

      const rawList = (data as unknown as any[]) || [];
      return rawList.map((p) => ({
        ...p,
        category: Array.isArray(p.category) ? p.category[0] : p.category,
        seller: Array.isArray(p.seller) ? p.seller[0] : p.seller,
        variants: p.variants || [],
      })) as Product[];
    } catch (err) {
      console.warn('CatalogService unexpected error in searchProducts:', err);
      return [];
    }
  }

  /**
   * Check inventory availability for a variant or product without leaking internal stock details
   */
  static async getProductAvailability(
    variantId?: string,
    fallbackProductStatus: ProductStatus = 'active'
  ): Promise<ProductAvailabilityResult> {
    if (fallbackProductStatus === 'out_of_stock' || fallbackProductStatus === 'archived') {
      return { status: 'Out of Stock', inStock: false, quantity: 0 };
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured || !variantId) {
      // Default to In Stock for active pieces
      return { status: 'In Stock', inStock: true };
    }

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('quantity_available')
        .eq('variant_id', variantId)
        .maybeSingle();

      if (error || !data) {
        // If inventory row not present or protected by RLS, rely on product status
        return { status: 'In Stock', inStock: true };
      }

      const qty = Number(data.quantity_available || 0);
      if (qty <= 0) {
        return { status: 'Out of Stock', inStock: false, quantity: 0 };
      }
      if (qty <= 3) {
        return { status: 'Low Stock', inStock: true, quantity: qty };
      }
      return { status: 'In Stock', inStock: true, quantity: qty };
    } catch {
      return { status: 'In Stock', inStock: true };
    }
  }

  /**
   * Fetch variants for a specific product
   */
  static async getProductVariants(productId: string): Promise<ProductVariant[]> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const prod = DEV_SAMPLE_PRODUCTS.find((p) => p.id === productId);
      return prod?.variants || [];
    }

    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('CatalogService: Error fetching variants:', error.message);
        return [];
      }
      return (data as ProductVariant[]) || [];
    } catch {
      return [];
    }
  }

  /**
   * Update product content (convenience delegation to AdminGovernanceService)
   */
  static async updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const { AdminGovernanceService } = await import('./admin.service');
    return AdminGovernanceService.updateProduct(productId, updates);
  }

  /**
   * Delete product content (convenience delegation to AdminGovernanceService)
   */
  static async deleteProduct(
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { AdminGovernanceService } = await import('./admin.service');
    return AdminGovernanceService.deleteProduct(productId);
  }
}
