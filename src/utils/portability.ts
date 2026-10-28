import { ProjectData } from '../types/journal';
import { INITIAL_DEFAULT_PROJECT } from './storage';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedProject?: ProjectData;
}

export function exportProjectToJson(project: ProjectData): string {
  // Ensure updatedAt is updated
  const exportPayload: ProjectData = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function downloadJsonFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateAndSanitizeImport(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return {
      valid: false,
      errors: [`Invalid JSON format: ${err.message || 'Syntax error'}`],
      warnings: [],
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      valid: false,
      errors: ['Project data must be a valid JSON object.'],
      warnings: [],
    };
  }

  // Check required core sections
  if (!parsed.pages || !Array.isArray(parsed.pages)) {
    errors.push('Missing or invalid "pages" array.');
  }

  if (!parsed.pattern || typeof parsed.pattern !== 'object') {
    errors.push('Missing "pattern" configuration.');
  }

  if (!parsed.cover || typeof parsed.cover !== 'object') {
    warnings.push('Missing "cover" configuration, applying standard defaults.');
  }

  if (!parsed.copyright || typeof parsed.copyright !== 'object') {
    warnings.push('Missing "copyright" configuration, applying standard defaults.');
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Construct sanitized project merging with default template to prevent missing keys
  const sanitized: ProjectData = {
    version: parsed.version || '2.0.0',
    id: parsed.id || `proj_imported_${Date.now()}`,
    name: parsed.name ? `${parsed.name} (Imported)` : 'Imported Pattern Journal',
    updatedAt: new Date().toISOString(),
    paperSize: parsed.paperSize || INITIAL_DEFAULT_PROJECT.paperSize,
    margins: {
      ...INITIAL_DEFAULT_PROJECT.margins,
      ...(parsed.margins || {}),
    },
    pattern: {
      ...INITIAL_DEFAULT_PROJECT.pattern,
      ...(parsed.pattern || {}),
      // Ensure custom pattern dataUrl is intact
      dataUrl: parsed.pattern.dataUrl || parsed.pattern.svgData || INITIAL_DEFAULT_PROJECT.pattern.dataUrl,
    },
    theme: {
      ...INITIAL_DEFAULT_PROJECT.theme,
      ...(parsed.theme || {}),
    },
    cover: {
      ...INITIAL_DEFAULT_PROJECT.cover,
      ...(parsed.cover || {}),
    },
    copyright: {
      ...INITIAL_DEFAULT_PROJECT.copyright,
      ...(parsed.copyright || {}),
    },
    pages: parsed.pages.map((p: any, idx: number) => ({
      id: p.id || `page_${idx + 1}`,
      template: p.template || 'lined',
      title: p.title || `Journal Page ${idx + 1}`,
      subtitle: p.subtitle || '',
      promptOrText: p.promptOrText || '',
      lineSpacingMm: p.lineSpacingMm || 7,
      gridSpacingMm: p.gridSpacingMm || 5,
      customNotes: p.customNotes || '',
      excludeNumbering: Boolean(p.excludeNumbering),
    })),
    pageCountMultiplier: Math.max(1, Math.min(20, parsed.pageCountMultiplier || 1)),
    numbering: {
      ...INITIAL_DEFAULT_PROJECT.numbering,
      ...(parsed.numbering || {}),
    },
    commercial: {
      ...INITIAL_DEFAULT_PROJECT.commercial,
      ...(parsed.commercial || {}),
    },
  };

  // Check if custom pattern has valid image data
  if (sanitized.pattern.type === 'custom') {
    if (!sanitized.pattern.dataUrl && !sanitized.pattern.svgData) {
      warnings.push('Custom pattern does not have embedded image data; falling back to preset.');
      sanitized.pattern.type = 'preset';
    }
  }

  return {
    valid: true,
    errors: [],
    warnings,
    sanitizedProject: sanitized,
  };
}
