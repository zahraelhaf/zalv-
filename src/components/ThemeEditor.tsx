import React from 'react';
import { ThemeConfig, ThemePaletteId, PaperSize, PAPER_SIZES } from '../types/journal';
import { THEME_PALETTES } from '../utils/themes';
import { Palette, FileText, CheckCircle2 } from 'lucide-react';

interface ThemeEditorProps {
  theme: ThemeConfig;
  paperSize: PaperSize;
  onThemeChange: (newTheme: ThemeConfig) => void;
  onPaperSizeChange: (newSize: PaperSize) => void;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({
  theme,
  paperSize,
  onThemeChange,
  onPaperSizeChange,
}) => {
  const handleSelectPalette = (paletteId: ThemePaletteId) => {
    const selected = THEME_PALETTES[paletteId];
    if (selected) {
      // Intentionally ONLY update the theme styling keys, keeping all other project data intact!
      onThemeChange({ ...selected });
    }
  };

  return (
    <div className="space-y-6">
      {/* Paper Trim Size Selection (Audit #3: paper sizes) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
          <span>Journal Paper Trim Size</span>
          <span className="text-neutral-400 font-normal">{PAPER_SIZES[paperSize].name}</span>
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {Object.values(PAPER_SIZES).map((p) => {
            const isSelected = paperSize === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPaperSizeChange(p.id)}
                className={`p-3 rounded-xl border text-left transition relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">{p.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  {p.widthMm} × {p.heightMm} mm ({p.widthIn}" × {p.heightIn}")
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 line-clamp-1">{p.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Palettes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Curated Color Aesthetics & Paper Tint
          </label>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Safe: Never resets user text
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {Object.values(THEME_PALETTES).map((pal) => {
            const isCurrent = theme.id === pal.id;
            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => handleSelectPalette(pal.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isCurrent
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {pal.name}
                    </span>
                    {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div
                      className="w-4 h-4 rounded-full border border-neutral-300 shadow-xs"
                      style={{ backgroundColor: pal.background }}
                      title="Paper Tint"
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-neutral-300 shadow-xs"
                      style={{ backgroundColor: pal.primary }}
                      title="Primary Line & Ink"
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-neutral-300 shadow-xs"
                      style={{ backgroundColor: pal.secondary }}
                      title="Accent"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
                  {pal.fontFamily} • {pal.paperTexture}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Typography Style Selection */}
      <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-neutral-500" />
          Typography Pairings & Font Family
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'serif', name: 'Editorial Serif', desc: 'Playfair Display + Inter' },
            { id: 'sans', name: 'Clean Modern', desc: 'Inter Sans + Clean Lines' },
            { id: 'display', name: 'Classical Antique', desc: 'Cinzel + Playfair' },
            { id: 'mono', name: 'Minimalist Mono', desc: 'Cinzel + JetBrains Mono' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onThemeChange({ ...theme, fontFamily: f.id as any })}
              className={`p-2.5 rounded-lg border text-left transition ${
                theme.fontFamily === f.id
                  ? 'border-indigo-600 bg-white dark:bg-neutral-800 text-indigo-900 dark:text-indigo-200 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <div className="text-xs font-semibold">{f.name}</div>
              <div className="text-[10px] text-neutral-500">{f.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
