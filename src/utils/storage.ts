import { ProjectData } from '../types/journal';
import { THEME_PALETTES } from './themes';
import { PRESET_PATTERNS, svgToDataUrl } from './presetPatterns';

const STORAGE_PROJECTS_KEY = 'pattern_journal_projects_v2';
const STORAGE_CURRENT_ID_KEY = 'pattern_journal_active_id_v2';

export const INITIAL_DEFAULT_PROJECT: ProjectData = {
  version: '2.0.0',
  id: 'proj_default_mindful',
  name: 'Mindful Botanical Journal',
  updatedAt: new Date().toISOString(),
  paperSize: 'kdp_6x9',
  margins: {
    topMm: 15,
    bottomMm: 15,
    innerGutterMm: 18, // Extra gutter for book binding!
    outerMm: 12,
    bleedMm: 3.175, // 0.125 inch
    useBleed: false,
  },
  pattern: {
    id: 'botanical_leaves',
    name: 'Botanical Leaves',
    type: 'preset',
    svgData: PRESET_PATTERNS[0].svgContent('#5c7866', 'transparent'),
    dataUrl: svgToDataUrl(PRESET_PATTERNS[0].svgContent('#5c7866', 'transparent')),
    scale: 75,
    opacity: 0.18,
    repeat: 'repeat',
    backgroundColor: '#ffffff',
    patternColor: '#5c7866',
    blendMode: 'normal',
    applyTo: 'all',
  },
  theme: {
    ...THEME_PALETTES.botanical_sage,
  },
  cover: {
    title: 'THE MINDFUL PATTERN JOURNAL',
    subtitle: 'Daily Reflections, Creative Patterns & Intentional Living',
    authorOrBrand: 'Aura Studio Press',
    editionBadge: 'FIRST EDITION • 2026',
    showSpineGuide: true,
    paperbackPaperType: 'white',
    coverStyle: 'elegant_frame',
    backCoverText: 'A calm space designed for intentional thought, pattern appreciation, and daily clarity.',
    showBarcodeBox: true,
    isbn: '978-1-987654-32-1',
  },
  copyright: {
    bookTitle: 'The Mindful Pattern Journal',
    authorOrPublisher: 'Aura Studio Press',
    publishedYear: 2026,
    edition: 'First Printing / Commercial Edition',
    disclaimer: 'All rights reserved. No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form without prior written permission from the publisher.',
    allRightsReserved: true,
    contactWebsite: 'www.patternjournalstudio.com',
    printedLocation: 'Printed in the United States of America',
    customLegalNotice: 'For personal mindfulness and reflective practice.',
  },
  pages: [
    {
      id: 'p_cover',
      template: 'cover',
      title: 'The Mindful Pattern Journal',
      subtitle: 'Cover Page',
      excludeNumbering: true,
    },
    {
      id: 'p_belongs',
      template: 'belongs_to',
      title: 'This Journal Belongs To',
      subtitle: 'Personal Property & Contact Info',
      promptOrText: 'If found, please return to its keeper with gratitude.',
      excludeNumbering: true,
    },
    {
      id: 'p_copy',
      template: 'copyright',
      title: 'Copyright & Colophon',
      subtitle: 'Commercial publication rights & metadata',
      excludeNumbering: true,
    },
    {
      id: 'p_gratitude_1',
      template: 'gratitude',
      title: 'Daily Gratitude & Grounding',
      subtitle: 'Morning Intention',
      promptOrText: 'What quiet beauty did you notice today? What gave you peace?',
      lineSpacingMm: 8,
    },
    {
      id: 'p_lined_1',
      template: 'lined',
      title: 'Stream of Consciousness',
      subtitle: 'Freeform Reflection',
      promptOrText: 'Write without hesitation. Let the thoughts flow onto the page.',
      lineSpacingMm: 7,
    },
    {
      id: 'p_dotgrid_1',
      template: 'dot_grid',
      title: 'Creative Dot Canvas',
      subtitle: '5mm Bullet Journaling',
      gridSpacingMm: 5,
    },
    {
      id: 'p_weekly_1',
      template: 'weekly_planner',
      title: 'Weekly Focus & Intentions',
      subtitle: 'Priorities & Milestone Tracker',
      promptOrText: 'Top 3 priorities this week: Focus, Flow, Restoration.',
    },
    {
      id: 'p_habit_1',
      template: 'habit_tracker',
      title: 'Monthly Habit Matrix',
      subtitle: 'Consistency over perfection',
    },
    {
      id: 'p_blank_1',
      template: 'blank_framed',
      title: 'Framed Sketch & Vision Board',
      subtitle: 'Visual brainstorming area',
    },
  ],
  pageCountMultiplier: 10, // Generates 90 pages total for standard commercial book
  numbering: {
    enabled: true,
    format: '- 1 -',
    position: 'bottom-center',
    skipCoverAndCopyright: true,
  },
  commercial: {
    productTitle: 'The Mindful Pattern Journal | 6x9 Guided Reflection Notebook',
    productSubtitle: 'Paperback Planner with Botanical Accents for Mindfulness',
    targetMarketplace: 'amazon_kdp',
    suggestedPriceUsd: 12.99,
    targetNiche: 'Mindfulness & Guided Self-Reflection',
    bulletPoints: [
      '6 x 9 Inch Amazon KDP standard trade paperback interior',
      'Pre-formatted botanical line headers with high readability',
      'Includes weekly planner, gratitude prompts, and habit matrix',
      'Engineered with gutter binding margin to prevent text clipping',
    ],
    searchKeywords: [
      'mindfulness journal',
      'kdp 6x9 notebook',
      'pattern stationery',
      'gratitude diary',
      'bullet planner',
    ],
    descriptionHtml: '<p>A beautifully structured journal designed for daily mindfulness and thoughtful planning.</p>',
  },
};

export function loadProjectsFromStorage(): Record<string, ProjectData> {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (!raw) {
      const initial: Record<string, ProjectData> = {
        [INITIAL_DEFAULT_PROJECT.id]: INITIAL_DEFAULT_PROJECT,
      };
      saveProjectsToStorage(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Object.keys(parsed).length === 0) {
      return { [INITIAL_DEFAULT_PROJECT.id]: INITIAL_DEFAULT_PROJECT };
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load projects from localStorage:', err);
    return { [INITIAL_DEFAULT_PROJECT.id]: INITIAL_DEFAULT_PROJECT };
  }
}

export function saveProjectsToStorage(projects: Record<string, ProjectData>): void {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage:', err);
  }
}

export function getActiveProjectId(): string {
  try {
    return localStorage.getItem(STORAGE_CURRENT_ID_KEY) || INITIAL_DEFAULT_PROJECT.id;
  } catch {
    return INITIAL_DEFAULT_PROJECT.id;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_CURRENT_ID_KEY, id);
  } catch (err) {
    console.error('Failed to set active project id:', err);
  }
}
