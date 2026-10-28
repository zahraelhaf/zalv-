export type PaperSize = 'a4' | 'letter' | 'a5' | 'kdp_6x9' | 'kdp_7x10' | 'square_8x8';

export interface PaperDimensions {
  id: PaperSize;
  name: string;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  description: string;
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  a4: {
    id: 'a4',
    name: 'A4 Standard',
    widthMm: 210,
    heightMm: 297,
    widthIn: 8.27,
    heightIn: 11.69,
    description: 'International standard document & printable size',
  },
  letter: {
    id: 'letter',
    name: 'US Letter',
    widthMm: 215.9,
    heightMm: 279.4,
    widthIn: 8.5,
    heightIn: 11.0,
    description: 'North American standard home/office printable',
  },
  a5: {
    id: 'a5',
    name: 'A5 Notebook',
    widthMm: 148,
    heightMm: 210,
    widthIn: 5.83,
    heightIn: 8.27,
    description: 'Compact daily carry bullet journal size',
  },
  kdp_6x9: {
    id: 'kdp_6x9',
    name: '6" × 9" Amazon KDP',
    widthMm: 152.4,
    heightMm: 228.6,
    widthIn: 6.0,
    heightIn: 9.0,
    description: 'Most popular Amazon KDP trade paperback size',
  },
  kdp_7x10: {
    id: 'kdp_7x10',
    name: '7" × 10" Executive',
    widthMm: 177.8,
    heightMm: 254.0,
    widthIn: 7.0,
    heightIn: 10.0,
    description: 'Medium executive planner & guided journal',
  },
  square_8x8: {
    id: 'square_8x8',
    name: '8" × 8" Square',
    widthMm: 203.2,
    heightMm: 203.2,
    widthIn: 8.0,
    heightIn: 8.0,
    description: 'Modern art journal & mindfulness square format',
  },
};

export type RepeatMode = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' | 'stagger';

export interface PatternConfig {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  svgData?: string;
  dataUrl?: string; // Base64 data URL for uploaded or generated pattern
  scale: number; // 20 to 200 percentage
  opacity: number; // 0.05 to 1.0
  repeat: RepeatMode;
  backgroundColor: string;
  patternColor: string;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  applyTo: 'all' | 'cover_only' | 'content_only' | 'background_only';
}

export type ThemePaletteId = 'classic_cream' | 'botanical_sage' | 'minimal_slate' | 'vintage_sepia' | 'rose_terracotta' | 'midnight_celestial';

export interface ThemeConfig {
  id: ThemePaletteId;
  name: string;
  primary: string; // Line/text main color
  secondary: string; // Subtle accents
  background: string; // Paper tint
  paperTexture: 'smooth' | 'parchment' | 'linen' | 'recycled';
  fontFamily: 'serif' | 'sans' | 'display' | 'mono';
  headingFont: string;
  bodyFont: string;
}

export type PageTemplateType = 
  | 'cover'
  | 'belongs_to'
  | 'copyright'
  | 'lined'
  | 'dot_grid'
  | 'grid'
  | 'weekly_planner'
  | 'daily_reflection'
  | 'habit_tracker'
  | 'gratitude'
  | 'blank_framed';

export interface JournalPage {
  id: string;
  template: PageTemplateType;
  title: string;
  subtitle?: string;
  promptOrText?: string;
  lineSpacingMm?: number; // e.g. 7mm for lined
  gridSpacingMm?: number; // e.g. 5mm for dot grid
  customNotes?: string;
  pageNumber?: number;
  excludeNumbering?: boolean;
}

export interface CoverConfig {
  title: string;
  subtitle: string;
  authorOrBrand: string;
  editionBadge: string;
  showSpineGuide: boolean;
  paperbackPaperType: 'white' | 'cream';
  coverStyle: 'minimal_bordered' | 'elegant_frame' | 'full_pattern' | 'geometric_modern';
  backCoverText: string;
  showBarcodeBox: boolean;
  isbn: string;
}

export interface CopyrightConfig {
  bookTitle: string;
  authorOrPublisher: string;
  publishedYear: number;
  edition: string;
  disclaimer: string;
  allRightsReserved: boolean;
  contactWebsite: string;
  printedLocation: string;
  customLegalNotice?: string;
}

export interface MarginsConfig {
  topMm: number;
  bottomMm: number;
  innerGutterMm: number; // Spine side
  outerMm: number;
  bleedMm: number; // 3.175 mm (0.125 in) for KDP bleed
  useBleed: boolean;
}

export interface CommercialMetadata {
  productTitle: string;
  productSubtitle: string;
  targetMarketplace: 'etsy' | 'amazon_kdp' | 'gumroad' | 'personal_print';
  suggestedPriceUsd: number;
  targetNiche: string;
  bulletPoints: string[];
  searchKeywords: string[];
  descriptionHtml: string;
}

export interface ProjectData {
  version: string;
  id: string;
  name: string;
  updatedAt: string;
  paperSize: PaperSize;
  margins: MarginsConfig;
  pattern: PatternConfig;
  theme: ThemeConfig;
  cover: CoverConfig;
  copyright: CopyrightConfig;
  pages: JournalPage[];
  pageCountMultiplier: number; // e.g. duplicate pages to reach 100 or 120 pages
  numbering: {
    enabled: boolean;
    format: '1' | 'Page 1' | '1 / N' | '- 1 -';
    position: 'bottom-center' | 'bottom-outer' | 'top-right';
    skipCoverAndCopyright: boolean;
  };
  commercial: CommercialMetadata;
}

export type AuditStatus = 'PASS' | 'FAIL' | 'NOT TESTED';

export interface AuditCheckItem {
  id: string;
  category: 'custom_pattern' | 'data_integrity' | 'pdf_quality' | 'project_portability' | 'commercial_readiness';
  title: string;
  requirement: string;
  status: AuditStatus;
  finding: string;
  resolution?: string;
  testedAt?: string;
}
