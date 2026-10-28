import React, { useRef } from 'react';
import { PatternConfig, RepeatMode } from '../types/journal';
import { PRESET_PATTERNS, svgToDataUrl } from '../utils/presetPatterns';
import { Upload, Sliders, Image as ImageIcon, Sparkles, RefreshCw } from 'lucide-react';

interface PatternEditorProps {
  pattern: PatternConfig;
  onChange: (updated: PatternConfig) => void;
}

export const PatternEditor: React.FC<PatternEditorProps> = ({ pattern, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) {
        onChange({
          ...pattern,
          type: 'custom',
          id: `custom_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          dataUrl: dataUrl,
          svgData: undefined,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const selectPreset = (presetId: string) => {
    const preset = PRESET_PATTERNS.find((p) => p.id === presetId);
    if (!preset) return;
    const svg = preset.svgContent(pattern.patternColor || '#5c7866', 'transparent');
    onChange({
      ...pattern,
      type: 'preset',
      id: preset.id,
      name: preset.name,
      svgData: svg,
      dataUrl: svgToDataUrl(svg),
    });
  };

  const repeatOptions: { id: RepeatMode; label: string; desc: string }[] = [
    { id: 'repeat', label: 'Full Grid', desc: 'Tiles horizontally and vertically' },
    { id: 'stagger', label: 'Stagger (Brick)', desc: 'Alternating brick-offset tiling' },
    { id: 'repeat-x', label: 'Horizontal Strip', desc: 'Repeats only in X axis' },
    { id: 'repeat-y', label: 'Vertical Spine', desc: 'Repeats only in Y axis' },
    { id: 'no-repeat', label: 'Center Motif', desc: 'Single watermark in page center' },
  ];

  return (
    <div className="space-y-6">
      {/* Pattern Type Toggle */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => {
            if (pattern.type !== 'preset') {
              selectPreset(PRESET_PATTERNS[0].id);
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            pattern.type === 'preset'
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Preset Studio Patterns
        </button>
        <button
          type="button"
          onClick={() => {
            if (pattern.type !== 'custom') {
              fileInputRef.current?.click();
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            pattern.type === 'custom'
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Upload className="w-4 h-4 text-indigo-600" />
          Custom Upload {pattern.type === 'custom' ? '(Active)' : ''}
        </button>
      </div>

      {/* Preset Picker */}
      {pattern.type === 'preset' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Select Vector Motif
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {PRESET_PATTERNS.map((p) => {
              const isSelected = pattern.id === p.id;
              const previewSvg = svgToDataUrl(p.svgContent('#1e293b', '#f8fafc'));
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPreset(p.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 bg-white dark:bg-neutral-800'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded border border-neutral-200 dark:border-neutral-700 bg-repeat shadow-inner"
                    style={{ backgroundImage: `url("${previewSvg}")`, backgroundSize: '24px 24px' }}
                  />
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 text-center truncate w-full">
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Upload Area */}
      {pattern.type === 'custom' && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Custom Pattern Asset
          </label>
          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-4 text-center hover:border-neutral-400 transition-colors bg-neutral-50/50 dark:bg-neutral-850">
            {pattern.dataUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-24 h-24 rounded-lg border shadow-sm bg-repeat"
                  style={{
                    backgroundImage: `url("${pattern.dataUrl}")`,
                    backgroundSize: `${pattern.scale}%`,
                  }}
                />
                <div className="text-xs text-neutral-600 dark:text-neutral-300">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{pattern.name}</span>
                  <p className="text-neutral-500 text-[11px]">Ready & encoded as Base64 data asset</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Replace Image
                </button>
              </div>
            ) : (
              <div className="py-4">
                <ImageIcon className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Upload seamless tile or motif image
                </p>
                <p className="text-[11px] text-neutral-500 mb-3">PNG, JPG, SVG, WebP supported</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                >
                  <Upload className="w-3.5 h-3.5" /> Choose Image File
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Repeating Mode (Audit #1) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
          <span>Tiling & Repeat Mode</span>
          <span className="text-neutral-400 font-normal">{pattern.repeat}</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {repeatOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange({ ...pattern, repeat: opt.id })}
              className={`p-2 rounded-lg border text-left transition ${
                pattern.repeat === opt.id
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-200'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              <div className="text-xs font-semibold">{opt.label}</div>
              <div className="text-[10px] text-neutral-500 truncate">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scale & Opacity Controls (Audit #1) */}
      <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          <Sliders className="w-4 h-4 text-neutral-500" />
          Pattern Geometry & Visibility
        </div>

        {/* Scale Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-600 dark:text-neutral-400">Tile Scale</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{pattern.scale}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="250"
            step="5"
            value={pattern.scale}
            onChange={(e) => onChange({ ...pattern, scale: Number(e.target.value) })}
            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-neutral-400">
            <span>20% (Fine micro-tile)</span>
            <span>100% (Natural)</span>
            <span>250% (Bold motif)</span>
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-600 dark:text-neutral-400">Pattern Watermark Opacity</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {Math.round(pattern.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.02"
            value={pattern.opacity}
            onChange={(e) => onChange({ ...pattern, opacity: Number(e.target.value) })}
            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-neutral-400">
            <span>5% (Subtle watermark)</span>
            <span>20% (Recommended for writing)</span>
            <span>100% (Opaque art)</span>
          </div>
        </div>

        {/* Background & Target Scope */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Background Fill
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={pattern.backgroundColor || '#ffffff'}
                onChange={(e) => onChange({ ...pattern, backgroundColor: e.target.value })}
                className="w-8 h-8 rounded border border-neutral-300 dark:border-neutral-600 cursor-pointer p-0.5"
              />
              <span className="text-xs font-mono text-neutral-700 dark:text-neutral-300">
                {pattern.backgroundColor || '#ffffff'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Apply Pattern To
            </label>
            <select
              value={pattern.applyTo}
              onChange={(e) => onChange({ ...pattern, applyTo: e.target.value as any })}
              className="w-full text-xs rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1.5 text-neutral-800 dark:text-neutral-200"
            >
              <option value="all">All Pages (Cover & Interior)</option>
              <option value="cover_only">Cover Only</option>
              <option value="content_only">Content Pages Only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
