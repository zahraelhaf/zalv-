import { ProjectData, PAPER_SIZES } from '../types/journal';

export interface SpineCalculation {
  pageCount: number;
  spineWidthMm: number;
  spineWidthIn: number;
  minPagesForSpineText: boolean; // Amazon requires >= 79-80 pages for spine text
  paperThicknessMm: number;
  totalCoverWidthMm: number; // Back + Spine + Front + 2*Bleed
  totalCoverHeightMm: number; // Height + 2*Bleed
}

export function calculateKdpSpine(project: ProjectData): SpineCalculation {
  const effectivePages = project.pages.length * (project.pageCountMultiplier || 1);
  // Amazon KDP page thickness standards:
  // Black & white on white paper: 0.002252 inches (0.0572008 mm) per page
  // Black & white on cream paper: 0.0025 inches (0.0635 mm) per page
  const isCream = project.cover.paperbackPaperType === 'cream';
  const thicknessPerSheetMm = isCream ? 0.0635 : 0.0572;
  const spineWidthMm = Math.max(1.0, effectivePages * thicknessPerSheetMm);
  const spineWidthIn = spineWidthMm / 25.4;

  const paper = PAPER_SIZES[project.paperSize];
  const bleed = project.margins.bleedMm;

  const totalCoverWidthMm = (paper.widthMm * 2) + spineWidthMm + (bleed * 2);
  const totalCoverHeightMm = paper.heightMm + (bleed * 2);

  return {
    pageCount: effectivePages,
    spineWidthMm: Number(spineWidthMm.toFixed(2)),
    spineWidthIn: Number(spineWidthIn.toFixed(3)),
    minPagesForSpineText: effectivePages >= 80,
    paperThicknessMm: thicknessPerSheetMm,
    totalCoverWidthMm: Number(totalCoverWidthMm.toFixed(2)),
    totalCoverHeightMm: Number(totalCoverHeightMm.toFixed(2)),
  };
}

export interface CommercialListingCopy {
  marketplace: string;
  title: string;
  subtitle: string;
  priceFormatted: string;
  bullets: string[];
  descriptionHtml: string;
  kdpCategories: string[];
  etsyTags: string[];
}

export function generateCommercialListing(project: ProjectData): CommercialListingCopy {
  const paper = PAPER_SIZES[project.paperSize];
  const spine = calculateKdpSpine(project);
  const title = project.cover.title || 'Gratitude & Pattern Reflection Journal';
  const subtitle = project.cover.subtitle || `${paper.name} Premium Paperback Notebook`;

  const bullets = [
    `📐 PERFECT TRIM SIZE: ${paper.name} (${paper.widthIn}" × ${paper.heightIn}" / ${paper.widthMm}mm × ${paper.heightMm}mm) – ideal portable format.`,
    `📖 EXPANDABLE INTERIOR: ${spine.pageCount} professionally formatted pages with custom pattern headers and high-contrast lines.`,
    `🌿 ELEGANT CRAFTSMANSHIP: Curated with ${project.theme.name} aesthetic and ${project.pattern.name} visual identity.`,
    `⚖️ BINDING SAFETY: Engineered with safe inner gutter margin (${project.margins.innerGutterMm}mm) preventing text loss in spine binding.`,
    `🛡️ COMMERCIAL READY: Includes formal copyright/colophon front matter and belongs-to dedication page.`,
  ];

  const descriptionHtml = `
<h2>${title}</h2>
<p><strong>${subtitle}</strong></p>
<p>Elevate your daily writing, mindfulness, or planning routine with this meticulously designed journal crafted for thinkers, creators, and professionals.</p>

<h3>Key Features:</h3>
<ul>
  ${bullets.map((b) => `<li>${b}</li>`).join('\n  ')}
</ul>

<h3>Product Specifications:</h3>
<ul>
  <li><strong>Trim Size:</strong> ${paper.name} (${paper.widthIn}" x ${paper.heightIn}")</li>
  <li><strong>Page Count:</strong> ${spine.pageCount} Pages</li>
  <li><strong>Theme:</strong> ${project.theme.name}</li>
  <li><strong>Publisher / Brand:</strong> ${project.cover.authorOrBrand || 'Pattern Journal Studio'}</li>
  <li><strong>Paper Weight Recommendation:</strong> 55# - 60# (90 GSM - 100 GSM)</li>
</ul>
<p>© ${project.copyright.publishedYear} ${project.copyright.authorOrPublisher}. All rights reserved.</p>
`.trim();

  const kdpCategories = [
    'Self-Help > Journaling & Guided Notebooks',
    'Crafts, Hobbies & Home > Decorative Arts & Design',
    'Health, Fitness & Dieting > Personal Transformation',
    'Business & Money > Time Management & Productivity',
  ];

  const etsyTags = [
    'pattern journal',
    'kdp low content',
    'printable planner',
    'guided diary',
    'bullet notebook',
    'aesthetic journal',
    'stationery design',
    'self care gift',
    'gratitude log',
    'minimalist book',
  ];

  return {
    marketplace: project.commercial.targetMarketplace,
    title,
    subtitle,
    priceFormatted: `$${project.commercial.suggestedPriceUsd.toFixed(2)}`,
    bullets,
    descriptionHtml,
    kdpCategories,
    etsyTags,
  };
}
