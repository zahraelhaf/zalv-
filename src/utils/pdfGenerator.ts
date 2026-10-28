import { jsPDF } from 'jspdf';
import { ProjectData, PAPER_SIZES, JournalPage } from '../types/journal';
import { createTiledCanvas } from './presetPatterns';

export interface PdfGenerationProgress {
  currentPage: number;
  totalPages: number;
  stage: string;
}

export async function generateJournalPdf(
  project: ProjectData,
  onProgress?: (progress: PdfGenerationProgress) => void
): Promise<jsPDF> {
  const paper = PAPER_SIZES[project.paperSize];
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [paper.widthMm, paper.heightMm],
    compress: true,
  });

  // Calculate pages list (including multiplier for journal volume if requested)
  const fullPageList: { page: JournalPage; pageIndex: number; isContent: boolean }[] = [];
  
  // Front matter pages first (only once)
  const frontMatter = project.pages.filter(
    (p) => p.template === 'cover' || p.template === 'belongs_to' || p.template === 'copyright'
  );
  // Content pages
  const contentPages = project.pages.filter(
    (p) => p.template !== 'cover' && p.template !== 'belongs_to' && p.template !== 'copyright'
  );

  frontMatter.forEach((p, idx) => {
    fullPageList.push({ page: p, pageIndex: idx, isContent: false });
  });

  // Multiply content pages to meet target commercial book length
  const multiplier = Math.max(1, project.pageCountMultiplier || 1);
  let contentCounter = frontMatter.length;
  for (let m = 0; m < multiplier; m++) {
    for (const p of contentPages) {
      fullPageList.push({
        page: { ...p, id: `${p.id}_rep_${m}` },
        pageIndex: contentCounter++,
        isContent: true,
      });
    }
  }

  const totalPages = fullPageList.length;

  // Prepare pattern image canvas if pattern exists
  let patternPngDataUrl: string | null = null;
  if (project.pattern && (project.pattern.dataUrl || project.pattern.svgData)) {
    try {
      const src = project.pattern.dataUrl || project.pattern.svgData!;
      // Scale calculation in pixels: base tile is ~120px * scale/100
      const baseTile = 120;
      const tilePx = Math.max(30, Math.round((baseTile * project.pattern.scale) / 100));
      // Render pattern canvas
      patternPngDataUrl = await createTiledCanvas(
        src,
        tilePx,
        tilePx,
        Math.round(paper.widthMm * 3), // ~75 DPI preview or high DPI
        Math.round(paper.heightMm * 3),
        project.pattern.repeat,
        project.pattern.opacity,
        project.pattern.backgroundColor || '#ffffff'
      );
    } catch (err) {
      console.warn('Could not generate pattern background canvas:', err);
    }
  }

  // Determine standard font mappings for jsPDF
  const fontChoice = project.theme.fontFamily === 'serif' ? 'times' :
                     project.theme.fontFamily === 'mono' ? 'courier' : 'helvetica';

  let physicalNumberCounter = 1;

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) {
      doc.addPage([paper.widthMm, paper.heightMm], 'portrait');
    }

    if (onProgress) {
      onProgress({
        currentPage: i + 1,
        totalPages,
        stage: `Rendering page ${i + 1} of ${totalPages}`,
      });
    }

    const { page, isContent } = fullPageList[i];
    const pageNum = i + 1;
    const isOdd = pageNum % 2 === 1;

    // Gutter margin logic for book binding:
    // For odd pages (recto / right page): gutter is on the left
    // For even pages (verso / left page): gutter is on the right
    const leftMargin = isOdd ? project.margins.innerGutterMm : project.margins.outerMm;
    const rightMargin = isOdd ? project.margins.outerMm : project.margins.innerGutterMm;
    const topMargin = project.margins.topMm;
    const bottomMargin = project.margins.bottomMm;
    const printableWidth = paper.widthMm - leftMargin - rightMargin;
    const printableHeight = paper.heightMm - topMargin - bottomMargin;

    // 1. Draw page background
    if (project.theme.background && project.theme.background !== '#ffffff') {
      const rgb = hexToRgb(project.theme.background);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(0, 0, paper.widthMm, paper.heightMm, 'F');
    }

    // 2. Draw pattern if applicable
    const shouldDrawPattern =
      patternPngDataUrl &&
      (project.pattern.applyTo === 'all' ||
        (project.pattern.applyTo === 'cover_only' && page.template === 'cover') ||
        (project.pattern.applyTo === 'content_only' && isContent));

    if (shouldDrawPattern && patternPngDataUrl) {
      try {
        // Draw pattern full page
        doc.addImage(
          patternPngDataUrl,
          'PNG',
          0,
          0,
          paper.widthMm,
          paper.heightMm,
          undefined,
          'FAST'
        );
      } catch (e) {
        console.warn('Error adding pattern image to page:', e);
      }
    }

    // 3. Render Page Template Content
    renderPageTemplate(
      doc,
      page,
      project,
      paper,
      leftMargin,
      rightMargin,
      topMargin,
      bottomMargin,
      printableWidth,
      printableHeight,
      fontChoice
    );

    // 4. Render Page Numbering (Audit #3: fonts, position, format, skipping cover/copyright)
    const isFrontMatterCover = page.template === 'cover' || page.template === 'copyright' || page.template === 'belongs_to';
    const shouldSkipNumber = project.numbering.skipCoverAndCopyright && isFrontMatterCover;

    if (project.numbering.enabled && !shouldSkipNumber && !page.excludeNumbering) {
      doc.setFont(fontChoice, 'normal');
      doc.setFontSize(9);
      const textRgb = hexToRgb(project.theme.secondary);
      doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);

      let numberText = `${physicalNumberCounter}`;
      if (project.numbering.format === '- 1 -') {
        numberText = `- ${physicalNumberCounter} -`;
      } else if (project.numbering.format === 'Page 1') {
        numberText = `Page ${physicalNumberCounter}`;
      } else if (project.numbering.format === '1 / N') {
        numberText = `${physicalNumberCounter} / ${totalPages}`;
      }

      let numX = paper.widthMm / 2;
      let numY = paper.heightMm - (bottomMargin / 2);

      if (project.numbering.position === 'bottom-outer') {
        numX = isOdd ? paper.widthMm - rightMargin : leftMargin;
      } else if (project.numbering.position === 'top-right') {
        numX = paper.widthMm - rightMargin;
        numY = topMargin / 1.5;
      }

      doc.text(numberText, numX, numY, { align: project.numbering.position === 'bottom-center' ? 'center' : (isOdd ? 'right' : 'left') });
      physicalNumberCounter++;
    }
  }

  return doc;
}

function renderPageTemplate(
  doc: jsPDF,
  page: JournalPage,
  project: ProjectData,
  paper: { widthMm: number; heightMm: number },
  left: number,
  right: number,
  top: number,
  bottom: number,
  width: number,
  height: number,
  fontFamily: string
) {
  const primaryRgb = hexToRgb(project.theme.primary);
  const secondaryRgb = hexToRgb(project.theme.secondary);

  switch (page.template) {
    case 'cover': {
      // Cover Page rendering with elegant borders and typography
      doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setLineWidth(0.8);
      // Double border frame
      doc.rect(left + 2, top + 2, width - 4, height - 4);
      doc.setLineWidth(0.3);
      doc.rect(left + 5, top + 5, width - 10, height - 10);

      // Badge / Edition
      if (project.cover.editionBadge) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.text(project.cover.editionBadge.toUpperCase(), paper.widthMm / 2, top + 22, { align: 'center' });
      }

      // Title (Wrapped properly to prevent text truncation!)
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(22);
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      const titleLines = doc.splitTextToSize(project.cover.title || 'JOURNAL', width - 24);
      doc.text(titleLines, paper.widthMm / 2, top + 45, { align: 'center', lineHeightFactor: 1.25 });

      // Divider line
      doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      doc.setLineWidth(0.4);
      const divY = top + 45 + (titleLines.length * 9) + 4;
      doc.line(paper.widthMm / 2 - 25, divY, paper.widthMm / 2 + 25, divY);

      // Subtitle (Wrapped to avoid overflow)
      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(11);
      doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      const subtitleLines = doc.splitTextToSize(project.cover.subtitle || '', width - 24);
      doc.text(subtitleLines, paper.widthMm / 2, divY + 8, { align: 'center', lineHeightFactor: 1.3 });

      // Author / Brand at bottom
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.text(project.cover.authorOrBrand.toUpperCase(), paper.widthMm / 2, paper.heightMm - bottom - 16, { align: 'center' });
      break;
    }

    case 'belongs_to': {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(18);
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.text(page.title || 'This Journal Belongs To', paper.widthMm / 2, top + 35, { align: 'center' });

      // Ornamental line
      doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      doc.setLineWidth(0.4);
      doc.line(paper.widthMm / 2 - 20, top + 42, paper.widthMm / 2 + 20, top + 42);

      // Fill in lines
      const startY = top + 65;
      const lineSpacing = 16;
      const labels = ['Name:', 'Email:', 'Phone:', 'Address:'];

      labels.forEach((label, idx) => {
        const y = startY + (idx * lineSpacing);
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.text(label, left + 10, y - 2);

        doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.setLineWidth(0.3);
        doc.line(left + 28, y, paper.widthMm - right - 10, y);
      });

      if (page.promptOrText) {
        doc.setFont(fontFamily, 'italic');
        doc.setFontSize(9);
        doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        const promptLines = doc.splitTextToSize(page.promptOrText, width - 20);
        doc.text(promptLines, paper.widthMm / 2, startY + (labels.length * lineSpacing) + 20, { align: 'center' });
      }
      break;
    }

    case 'copyright': {
      // Commercial Copyright / Colophon page
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.text(project.copyright.bookTitle, left + 4, top + 30);

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      doc.text(project.copyright.edition, left + 4, top + 38);

      let curY = top + 52;
      const gap = 6;

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);

      doc.text(`Published by: ${project.copyright.authorOrPublisher}`, left + 4, curY);
      curY += gap;
      doc.text(`Copyright © ${project.copyright.publishedYear} by ${project.copyright.authorOrPublisher}`, left + 4, curY);
      curY += gap;

      if (project.cover.isbn) {
        doc.text(`ISBN: ${project.cover.isbn}`, left + 4, curY);
        curY += gap;
      }

      if (project.copyright.printedLocation) {
        doc.text(project.copyright.printedLocation, left + 4, curY);
        curY += gap;
      }

      if (project.copyright.contactWebsite) {
        doc.text(`Website: ${project.copyright.contactWebsite}`, left + 4, curY);
        curY += gap + 4;
      }

      // Legal disclaimer wrapped with splitTextToSize to prevent overflow
      const disclaimerLines = doc.splitTextToSize(project.copyright.disclaimer, width - 8);
      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(8);
      doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      doc.text(disclaimerLines, left + 4, curY, { lineHeightFactor: 1.3 });

      break;
    }

    case 'lined': {
      renderStandardHeader(doc, page, left, top, width, fontFamily, primaryRgb, secondaryRgb);

      const headerOffset = page.promptOrText ? 30 : 20;
      const lineSpacing = page.lineSpacingMm || 7;
      const startY = top + headerOffset;
      const endY = paper.heightMm - bottom - 5;

      doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      doc.setLineWidth(0.2);

      for (let y = startY; y <= endY; y += lineSpacing) {
        doc.line(left, y, paper.widthMm - right, y);
      }
      break;
    }

    case 'dot_grid': {
      renderStandardHeader(doc, page, left, top, width, fontFamily, primaryRgb, secondaryRgb);

      const spacing = page.gridSpacingMm || 5;
      const startX = left + ((width % spacing) / 2);
      const startY = top + 22;
      const endX = paper.widthMm - right;
      const endY = paper.heightMm - bottom - 5;

      doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);

      for (let y = startY; y <= endY; y += spacing) {
        for (let x = startX; x <= endX; x += spacing) {
          doc.circle(x, y, 0.22, 'F');
        }
      }
      break;
    }

    case 'grid': {
      renderStandardHeader(doc, page, left, top, width, fontFamily, primaryRgb, secondaryRgb);

      const spacing = page.gridSpacingMm || 5;
      const startX = left;
      const startY = top + 22;
      const endX = paper.widthMm - right;
      const endY = paper.heightMm - bottom - 5;

      doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      doc.setLineWidth(0.15);

      for (let x = startX; x <= endX; x += spacing) {
        doc.line(x, startY, x, endY);
      }
      for (let y = startY; y <= endY; y += spacing) {
        doc.line(startX, y, endX, y);
      }
      break;
    }

    case 'weekly_planner': {
      renderStandardHeader(doc, page, left, top, width, fontFamily, primaryRgb, secondaryRgb);

      const startY = top + 22;
      const colWidth = (width - 4) / 2;
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekend & Notes'];
      const boxHeight = (paper.heightMm - bottom - startY - 8) / 3;

      days.forEach((day, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = left + (col * (colWidth + 4));
        const by = startY + (row * (boxHeight + 3));

        doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.setLineWidth(0.3);
        doc.rect(bx, by, colWidth, boxHeight);

        // Header strip
        doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        doc.text(day.toUpperCase(), bx + 3, by + 5);

        // Sub lines inside day box
        doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.setLineWidth(0.15);
        for (let ly = by + 9; ly < by + boxHeight - 2; ly += 5.5) {
          doc.line(bx + 3, ly, bx + colWidth - 3, ly);
        }
      });
      break;
    }

    case 'habit_tracker': {
      renderStandardHeader(doc, page, left, top, width, fontFamily, primaryRgb, secondaryRgb);

      const startY = top + 24;
      const rowHeight = 9;
      const habitsCount = 12;
      const habitColWidth = Math.min(45, width * 0.35);
      const daysCount = 31;
      const dayCellWidth = (width - habitColWidth) / daysCount;

      // Header row
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7);
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.text('HABIT / ROUTINE', left + 2, startY - 2);

      for (let d = 1; d <= daysCount; d++) {
        const cx = left + habitColWidth + ((d - 1) * dayCellWidth);
        doc.text(`${d}`, cx + (dayCellWidth / 2), startY - 2, { align: 'center' });
      }

      // Draw grid
      for (let r = 0; r < habitsCount; r++) {
        const ry = startY + (r * rowHeight);
        doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.setLineWidth(0.2);
        doc.rect(left, ry, width, rowHeight);

        // Vertical divider separating habit name from day checkboxes
        doc.line(left + habitColWidth, ry, left + habitColWidth, ry + rowHeight);

        for (let d = 1; d <= daysCount; d++) {
          const cx = left + habitColWidth + (d * dayCellWidth);
          doc.line(cx, ry, cx, ry + rowHeight);
        }
      }
      break;
    }

    case 'gratitude': {
      renderStandardHeader(doc, page, left, top, width, fontFamily, primaryRgb, secondaryRgb);

      const sections = [
        { label: '3 Things I Am Deeply Grateful For Today:', lines: 3 },
        { label: 'What Would Make Today Fulfilling & Peaceful?', lines: 3 },
        { label: 'Daily Affirmation & Mental Clarity:', lines: 2 },
        { label: 'Evening Reflection & Wins:', lines: 4 },
      ];

      let curY = top + 24;
      const lineStep = page.lineSpacingMm || 8;

      sections.forEach((sec) => {
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        doc.text(sec.label.toUpperCase(), left + 2, curY);
        curY += 4;

        doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.setLineWidth(0.2);
        for (let l = 0; l < sec.lines; l++) {
          curY += lineStep;
          doc.line(left + 2, curY, paper.widthMm - right - 2, curY);
        }
        curY += 7;
      });
      break;
    }

    case 'blank_framed': {
      renderStandardHeader(doc, page, left, top, width, fontFamily, primaryRgb, secondaryRgb);

      const startY = top + 22;
      const frameHeight = paper.heightMm - bottom - startY - 5;

      doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      doc.setLineWidth(0.3);
      doc.rect(left, startY, width, frameHeight);

      // Subtle inner corner accents
      const cornerSize = 4;
      doc.setLineWidth(0.6);
      doc.line(left + 2, startY + 2 + cornerSize, left + 2, startY + 2);
      doc.line(left + 2, startY + 2, left + 2 + cornerSize, startY + 2);

      doc.line(left + width - 2 - cornerSize, startY + 2, left + width - 2, startY + 2);
      doc.line(left + width - 2, startY + 2, left + width - 2, startY + 2 + cornerSize);
      break;
    }

    default:
      renderStandardHeader(doc, page, left, top, width, fontFamily, primaryRgb, secondaryRgb);
      break;
  }
}

function renderStandardHeader(
  doc: jsPDF,
  page: JournalPage,
  left: number,
  top: number,
  width: number,
  fontFamily: string,
  primaryRgb: { r: number; g: number; b: number },
  secondaryRgb: { r: number; g: number; b: number }
) {
  // Page Title with text-wrap safety
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  const titleLines = doc.splitTextToSize(page.title, width - 40);
  doc.text(titleLines, left, top + 5);

  // Date line on the right
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.text('Date: ____________', left + width - 32, top + 5);

  let nextY = top + 5 + (titleLines.length * 5);

  if (page.promptOrText) {
    doc.setFont(fontFamily, 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
    const promptLines = doc.splitTextToSize(page.promptOrText, width - 10);
    doc.text(promptLines, left, nextY + 2, { lineHeightFactor: 1.25 });
  }

  // Header separator line
  doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.setLineWidth(0.3);
  const lineY = page.promptOrText ? nextY + 8 : top + 10;
  doc.line(left, lineY, left + width, lineY);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return { r, g, b };
}
