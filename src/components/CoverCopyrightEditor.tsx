import React, { useState } from 'react';
import { CoverConfig, CopyrightConfig, ProjectData } from '../types/journal';
import { calculateKdpSpine } from '../utils/commercial';
import { BookMarked, ShieldCheck, Info } from 'lucide-react';

interface CoverCopyrightEditorProps {
  project: ProjectData;
  onUpdateCover: (cover: CoverConfig) => void;
  onUpdateCopyright: (copyright: CopyrightConfig) => void;
}

export const CoverCopyrightEditor: React.FC<CoverCopyrightEditorProps> = ({
  project,
  onUpdateCover,
  onUpdateCopyright,
}) => {
  const [subTab, setSubTab] = useState<'cover' | 'copyright'>('cover');

  const cover = project.cover;
  const copyright = project.copyright;
  const spine = calculateKdpSpine(project);

  return (
    <div className="space-y-5">
      {/* Sub Tabs */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setSubTab('cover')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
            subTab === 'cover'
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5" />
            Cover & Spine Engineering
          </div>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('copyright')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
            subTab === 'copyright'
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Copyright & Colophon
          </div>
        </button>
      </div>

      {subTab === 'cover' && (
        <div className="space-y-4">
          {/* Spine calculation badge */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-600" />
                Amazon KDP Spine Thickness: {spine.spineWidthMm} mm ({spine.spineWidthIn}")
              </span>
              <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300">
                {spine.pageCount} Total Pages
              </span>
            </div>
            <p className="text-[11px] text-emerald-900/70 dark:text-emerald-300">
              Total full paperback wrap dimensions: {spine.totalCoverWidthMm} × {spine.totalCoverHeightMm} mm
              {spine.minPagesForSpineText
                ? ' • Meets 80+ page requirement for printed spine text'
                : ' • Under 80 pages (spine text omitted on thin books)'}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Main Book Title
            </label>
            <input
              type="text"
              value={cover.title}
              onChange={(e) => onUpdateCover({ ...cover, title: e.target.value })}
              className="w-full text-xs font-semibold rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Subtitle / Focus Statement
            </label>
            <input
              type="text"
              value={cover.subtitle}
              onChange={(e) => onUpdateCover({ ...cover, subtitle: e.target.value })}
              className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Author / Studio Brand
              </label>
              <input
                type="text"
                value={cover.authorOrBrand}
                onChange={(e) => onUpdateCover({ ...cover, authorOrBrand: e.target.value })}
                className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Edition Badge
              </label>
              <input
                type="text"
                value={cover.editionBadge}
                onChange={(e) => onUpdateCover({ ...cover, editionBadge: e.target.value })}
                className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                KDP Paper Thickness Spec
              </label>
              <select
                value={cover.paperbackPaperType}
                onChange={(e) => onUpdateCover({ ...cover, paperbackPaperType: e.target.value as any })}
                className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1.5"
              >
                <option value="white">White Paper (0.002252 in/page)</option>
                <option value="cream">Cream Paper (0.0025 in/page)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                ISBN-13 (Optional)
              </label>
              <input
                type="text"
                value={cover.isbn}
                onChange={(e) => onUpdateCover({ ...cover, isbn: e.target.value })}
                placeholder="978-..."
                className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
              />
            </div>
          </div>
        </div>
      )}

      {subTab === 'copyright' && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Commercial Rights & Colophon Front Matter
          </div>
          <p className="text-[11px] text-neutral-500">
            This metadata renders on page 3 of the interior, establishing copyright protection for Amazon KDP or Etsy commercial distribution.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Book Title in Notice
              </label>
              <input
                type="text"
                value={copyright.bookTitle}
                onChange={(e) => onUpdateCopyright({ ...copyright, bookTitle: e.target.value })}
                className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Publisher / Copyright Holder
              </label>
              <input
                type="text"
                value={copyright.authorOrPublisher}
                onChange={(e) => onUpdateCopyright({ ...copyright, authorOrPublisher: e.target.value })}
                className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Year of Publication
              </label>
              <input
                type="number"
                value={copyright.publishedYear}
                onChange={(e) => onUpdateCopyright({ ...copyright, publishedYear: Number(e.target.value) })}
                className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Edition Statement
              </label>
              <input
                type="text"
                value={copyright.edition}
                onChange={(e) => onUpdateCopyright({ ...copyright, edition: e.target.value })}
                className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Contact / Brand Website
            </label>
            <input
              type="text"
              value={copyright.contactWebsite}
              onChange={(e) => onUpdateCopyright({ ...copyright, contactWebsite: e.target.value })}
              className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Legal Disclaimer & Rights
            </label>
            <textarea
              rows={3}
              value={copyright.disclaimer}
              onChange={(e) => onUpdateCopyright({ ...copyright, disclaimer: e.target.value })}
              className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
            />
          </div>
        </div>
      )}
    </div>
  );
};
