import React, { useState } from 'react';
import { JournalPage, PageTemplateType, MarginsConfig, ProjectData } from '../types/journal';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Settings2,
  BookOpen,
  Hash,
} from 'lucide-react';

interface PagesEditorProps {
  project: ProjectData;
  activePageIndex: number;
  onSelectPageIndex: (index: number) => void;
  onUpdatePages: (pages: JournalPage[]) => void;
  onUpdateMargins: (margins: MarginsConfig) => void;
  onUpdateNumbering: (numbering: ProjectData['numbering']) => void;
  onUpdateMultiplier: (multiplier: number) => void;
}

export const PagesEditor: React.FC<PagesEditorProps> = ({
  project,
  activePageIndex,
  onSelectPageIndex,
  onUpdatePages,
  onUpdateMargins,
  onUpdateNumbering,
  onUpdateMultiplier,
}) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'margins' | 'numbering'>('pages');

  const pages = project.pages;

  const handleAddPage = (template: PageTemplateType) => {
    const templateNames: Record<PageTemplateType, string> = {
      cover: 'Cover Page',
      belongs_to: 'This Journal Belongs To',
      copyright: 'Copyright & Colophon',
      lined: 'Lined Journal Page',
      dot_grid: 'Dot Grid 5mm',
      grid: 'Quadrille Grid 5mm',
      weekly_planner: 'Weekly Focus & Intentions',
      daily_reflection: 'Daily Reflection & Wins',
      habit_tracker: 'Monthly Habit Matrix',
      gratitude: 'Daily Gratitude Prompts',
      blank_framed: 'Framed Sketch & Vision',
    };

    const newPage: JournalPage = {
      id: `p_${Date.now()}`,
      template,
      title: templateNames[template],
      subtitle: 'Interior Page',
      promptOrText: template === 'lined' ? 'What inspired you today?' : '',
      lineSpacingMm: 7,
      gridSpacingMm: 5,
    };

    const updated = [...pages, newPage];
    onUpdatePages(updated);
    onSelectPageIndex(updated.length - 1);
  };

  const handleRemovePage = (index: number) => {
    if (pages.length <= 1) {
      alert('A journal must have at least one page.');
      return;
    }
    const updated = pages.filter((_, i) => i !== index);
    onUpdatePages(updated);
    onSelectPageIndex(Math.max(0, index - 1));
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    onUpdatePages(newPages);
    onSelectPageIndex(targetIndex);
  };

  const handleUpdateCurrentPage = (partial: Partial<JournalPage>) => {
    const updated = pages.map((p, idx) => (idx === activePageIndex ? { ...p, ...partial } : p));
    onUpdatePages(updated);
  };

  const activePage = pages[activePageIndex] || pages[0];

  return (
    <div className="space-y-5">
      {/* Sub Tabs */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
            activeTab === 'pages'
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Page Structure ({pages.length})
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('margins')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
            activeTab === 'margins'
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            Margins & Gutter
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('numbering')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
            activeTab === 'numbering'
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Hash className="w-3.5 h-3.5" />
            Numbering
          </div>
        </button>
      </div>

      {activeTab === 'pages' && (
        <div className="space-y-5">
          {/* Page List Pill Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Select Page to Edit
              </label>
              <span className="text-[11px] text-neutral-400">Drag/reorder with arrows</span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
              {pages.map((p, idx) => {
                const isSelected = idx === activePageIndex;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPageIndex(idx)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] w-4 text-neutral-400">{idx + 1}</span>
                      <span className="font-medium truncate">{p.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                        {p.template.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMovePage(idx, 'up')}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded disabled:opacity-30"
                        title="Move Page Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === pages.length - 1}
                        onClick={() => handleMovePage(idx, 'down')}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded disabled:opacity-30"
                        title="Move Page Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePage(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Page Dropdown Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              Add Interior Page Template
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'lined', label: '+ Lined' },
                { id: 'dot_grid', label: '+ Dot Grid' },
                { id: 'grid', label: '+ Quadrille' },
                { id: 'weekly_planner', label: '+ Weekly' },
                { id: 'habit_tracker', label: '+ Habits' },
                { id: 'gratitude', label: '+ Gratitude' },
                { id: 'blank_framed', label: '+ Framed' },
                { id: 'belongs_to', label: '+ Belongs To' },
                { id: 'copyright', label: '+ Copyright' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAddPage(item.id as PageTemplateType)}
                  className="px-2 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3 h-3 text-indigo-500" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Page Property Inspector */}
          {activePage && (
            <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                <span>Edit Page #{activePageIndex + 1}: {activePage.title}</span>
                <span className="text-neutral-400 font-normal capitalize">
                  {activePage.template.replace('_', ' ')}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                  Page Header Title
                </label>
                <input
                  type="text"
                  value={activePage.title}
                  onChange={(e) => handleUpdateCurrentPage({ title: e.target.value })}
                  className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                  Guiding Prompt or Subtitle (Auto-wraps to avoid PDF text clipping)
                </label>
                <textarea
                  rows={2}
                  value={activePage.promptOrText || ''}
                  onChange={(e) => handleUpdateCurrentPage({ promptOrText: e.target.value })}
                  placeholder="Optional journal prompt or note..."
                  className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              {activePage.template === 'lined' && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600 dark:text-neutral-400">Line Spacing</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {activePage.lineSpacingMm || 7} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="12"
                    step="1"
                    value={activePage.lineSpacingMm || 7}
                    onChange={(e) => handleUpdateCurrentPage({ lineSpacingMm: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>5mm (College ruled)</span>
                    <span>7mm (Standard)</span>
                    <span>12mm (Wide ruled)</span>
                  </div>
                </div>
              )}

              {(activePage.template === 'dot_grid' || activePage.template === 'grid') && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600 dark:text-neutral-400">Grid Spacing</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {activePage.gridSpacingMm || 5} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    step="1"
                    value={activePage.gridSpacingMm || 5}
                    onChange={(e) => handleUpdateCurrentPage({ gridSpacingMm: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* Page Multiplier for Commercial Volume */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Amazon KDP Commercial Page Multiplier
              </div>
              <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300">
                Duplicates interior pages to create full 80-120 page books.
              </p>
            </div>
            <select
              value={project.pageCountMultiplier}
              onChange={(e) => onUpdateMultiplier(Number(e.target.value))}
              className="text-xs font-semibold rounded-md border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-indigo-900 dark:text-indigo-100"
            >
              <option value="1">1x (Single Interior cycle)</option>
              <option value="5">5x (~35-45 pages)</option>
              <option value="10">10x (~75-90 pages - KDP Recommended)</option>
              <option value="15">15x (~120 pages standard trade)</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === 'margins' && (
        <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
          <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Book Binding Gutter & Bleed Settings
          </div>
          <p className="text-[11px] text-neutral-500">
            For paperback printing, the inner spine gutter must be wider than outer margins to prevent text clipping during binding.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Inner Gutter Margin (Spine)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="35"
                  value={project.margins.innerGutterMm}
                  onChange={(e) => onUpdateMargins({ ...project.margins, innerGutterMm: Number(e.target.value) })}
                  className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
                />
                <span className="text-xs text-neutral-400">mm</span>
              </div>
              <span className="text-[10px] text-neutral-400">Min 15-18mm for KDP</span>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Outer Margin
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="8"
                  max="25"
                  value={project.margins.outerMm}
                  onChange={(e) => onUpdateMargins({ ...project.margins, outerMm: Number(e.target.value) })}
                  className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
                />
                <span className="text-xs text-neutral-400">mm</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Top Margin
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="8"
                  max="30"
                  value={project.margins.topMm}
                  onChange={(e) => onUpdateMargins({ ...project.margins, topMm: Number(e.target.value) })}
                  className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
                />
                <span className="text-xs text-neutral-400">mm</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                Bottom Margin
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="8"
                  max="30"
                  value={project.margins.bottomMm}
                  onChange={(e) => onUpdateMargins({ ...project.margins, bottomMm: Number(e.target.value) })}
                  className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5"
                />
                <span className="text-xs text-neutral-400">mm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'numbering' && (
        <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Enable Automatic Pagination
            </span>
            <input
              type="checkbox"
              checked={project.numbering.enabled}
              onChange={(e) => onUpdateNumbering({ ...project.numbering, enabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
            />
          </div>

          {project.numbering.enabled && (
            <>
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Page Number Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '- 1 -', label: '- 1 - (Ornamental)' },
                    { id: '1', label: '1 (Plain Numeral)' },
                    { id: 'Page 1', label: 'Page 1 (Word Prefix)' },
                    { id: '1 / N', label: '1 / 90 (Fraction Total)' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => onUpdateNumbering({ ...project.numbering, format: fmt.id as any })}
                      className={`p-2 rounded-lg border text-xs text-left transition ${
                        project.numbering.format === fmt.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Number Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bottom-center', label: 'Bottom Center' },
                    { id: 'bottom-outer', label: 'Alternating Outer' },
                    { id: 'top-right', label: 'Top Right' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => onUpdateNumbering({ ...project.numbering, position: pos.id as any })}
                      className={`p-2 rounded-lg border text-xs text-left transition ${
                        project.numbering.position === pos.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <input
                  type="checkbox"
                  id="skipFront"
                  checked={project.numbering.skipCoverAndCopyright}
                  onChange={(e) =>
                    onUpdateNumbering({ ...project.numbering, skipCoverAndCopyright: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
                <label htmlFor="skipFront" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Skip numbering on Cover, Belongs-to, and Copyright front matter (Standard Publishing)
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
