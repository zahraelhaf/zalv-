import React, { useState } from 'react';
import { ProjectData } from '../types/journal';
import { generateCommercialListing, calculateKdpSpine } from '../utils/commercial';
import { downloadTextFile } from '../utils/portability';
import {
  ShoppingBag,
  Copy,
  Check,
  FileDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface CommercialHubProps {
  project: ProjectData;
  onUpdateCommercial: (commercial: ProjectData['commercial']) => void;
}

export const CommercialHub: React.FC<CommercialHubProps> = ({ project, onUpdateCommercial }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const listing = generateCommercialListing(project);
  const spine = calculateKdpSpine(project);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadSummary = () => {
    const summaryText = `
======================================================
  PATTERN JOURNAL STUDIO - COMMERCIAL PRODUCT SUMMARY
======================================================
Generated: ${new Date().toLocaleString()}
Marketplace: ${listing.marketplace.toUpperCase()}

[TITLE & LISTING INFO]
Product Name: ${listing.title}
Subtitle: ${listing.subtitle}
Suggested Retail Price: ${listing.priceFormatted}

[PHYSICAL BOOK SPECIFICATIONS]
Trim Size: ${project.paperSize}
Total Pages: ${spine.pageCount}
Paper Type: ${project.cover.paperbackPaperType}
Calculated Spine Thickness: ${spine.spineWidthMm} mm (${spine.spineWidthIn} in)
Total Cover Spread Dimensions: ${spine.totalCoverWidthMm} x ${spine.totalCoverHeightMm} mm
Spine Text Allowed: ${spine.minPagesForSpineText ? 'YES (>= 80 pages)' : 'NO (< 80 pages)'}
Inner Gutter Margin: ${project.margins.innerGutterMm} mm
Bleed: ${project.margins.bleedMm} mm

[COMMERCIAL BULLET POINTS]
${listing.bullets.map((b) => `• ${b}`).join('\n')}

[ETSY / SEARCH TAGS]
${listing.etsyTags.join(', ')}

[RECOMMENDED AMAZON KDP CATEGORIES]
${listing.kdpCategories.map((c) => `- ${c}`).join('\n')}

[PRODUCT DESCRIPTION HTML]
${listing.descriptionHtml}

[COPYRIGHT & LEGAL]
Copyright © ${project.copyright.publishedYear} ${project.copyright.authorOrPublisher}
Disclaimer: ${project.copyright.disclaimer}
Website: ${project.copyright.contactWebsite}
======================================================
`.trim();

    downloadTextFile(`${project.name.toLowerCase().replace(/\s+/g, '_')}_listing_summary.txt`, summaryText);
  };

  // Compliance checks
  const checks = [
    {
      title: 'Amazon KDP Safe Inner Gutter (Binding)',
      passed: project.margins.innerGutterMm >= 15,
      detail: `Current: ${project.margins.innerGutterMm}mm (Required: >= 15mm / 0.6in for spine binding without text loss).`,
    },
    {
      title: 'Commercial Copyright Front Matter',
      passed: Boolean(project.copyright.authorOrPublisher && project.copyright.disclaimer),
      detail: 'Copyright statement and publisher entity defined for legal commercial distribution.',
    },
    {
      title: 'Belongs-To Dedication Page',
      passed: project.pages.some((p) => p.template === 'belongs_to'),
      detail: 'Standard introductory property page for customer personalization.',
    },
    {
      title: 'Page Count Multiplier for KDP Bound Paperback',
      passed: spine.pageCount >= 24,
      detail: `Current: ${spine.pageCount} pages. (KDP requires minimum 24 pages for standard paperbacks).`,
    },
    {
      title: 'High Resolution Custom Pattern / SVG',
      passed: Boolean(project.pattern.dataUrl || project.pattern.svgData),
      detail: 'Vector or high-resolution raster pattern active with repeat scaling support.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Marketplace Selector */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
        {[
          { id: 'amazon_kdp', label: 'Amazon KDP Paperback' },
          { id: 'etsy', label: 'Etsy Printable / POD' },
          { id: 'gumroad', label: 'Gumroad Digital' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onUpdateCommercial({ ...project.commercial, targetMarketplace: m.id as any })}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
              project.commercial.targetMarketplace === m.id
                ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Compliance Quality Checklist */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            Commercial Distribution Compliance Checklist
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            {checks.filter((c) => c.passed).length}/{checks.length} Verified
          </span>
        </div>

        <div className="space-y-2">
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {c.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className={`font-medium ${c.passed ? 'text-neutral-800 dark:text-neutral-200' : 'text-amber-800 dark:text-amber-300'}`}>
                  {c.title}
                </span>
                <p className="text-[11px] text-neutral-500">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Name & Pricing */}
      <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Product Listing Title & Price
          </span>
          <button
            type="button"
            onClick={handleDownloadSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <FileDown className="w-3.5 h-3.5" /> Export Product Summary (.txt)
          </button>
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
            Product Name (Optimized for Search)
          </label>
          <div className="relative">
            <input
              type="text"
              value={project.commercial.productTitle}
              onChange={(e) => onUpdateCommercial({ ...project.commercial, productTitle: e.target.value })}
              className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 pr-9 px-3 py-2 text-neutral-900 dark:text-neutral-100"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(project.commercial.productTitle, 'title')}
              className="absolute right-2 top-2 p-1 text-neutral-400 hover:text-neutral-700"
              title="Copy Title"
            >
              {copiedKey === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Suggested Retail Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-neutral-400">$</span>
              <input
                type="number"
                step="0.5"
                value={project.commercial.suggestedPriceUsd}
                onChange={(e) => onUpdateCommercial({ ...project.commercial, suggestedPriceUsd: Number(e.target.value) })}
                className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 pl-7 pr-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Primary Niche
            </label>
            <input
              type="text"
              value={project.commercial.targetNiche}
              onChange={(e) => onUpdateCommercial({ ...project.commercial, targetNiche: e.target.value })}
              className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Generated Bullet Points */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Key Feature Bullets (Ready to Paste)
          </label>
          <button
            type="button"
            onClick={() => copyToClipboard(listing.bullets.join('\n'), 'bullets')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            {copiedKey === 'bullets' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy All Bullets
              </>
            )}
          </button>
        </div>

        <div className="space-y-1.5">
          {listing.bullets.map((b, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 flex items-center justify-between gap-2"
            >
              <span className="truncate">{b}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(b, `b_${idx}`)}
                className="p-1 text-neutral-400 hover:text-neutral-700 shrink-0"
              >
                {copiedKey === `b_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
