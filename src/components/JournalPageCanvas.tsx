import React, { useEffect, useRef } from 'react';
import { JournalPage, ProjectData, PAPER_SIZES } from '../types/journal';

interface JournalPageCanvasProps {
  page: JournalPage;
  pageIndex: number;
  totalPages: number;
  project: ProjectData;
  showGuides?: boolean;
  scaleFactor?: number;
}

export const JournalPageCanvas: React.FC<JournalPageCanvasProps> = ({
  page,
  pageIndex,
  totalPages,
  project,
  showGuides = true,
  scaleFactor = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paper = PAPER_SIZES[project.paperSize];

  // Canvas resolution: standard 1.5x pixel ratio for crisp display
  // 1 mm ~ 3.7795 px at 96 DPI
  const MM_TO_PX = 3.78 * scaleFactor;
  const canvasWidth = Math.round(paper.widthMm * MM_TO_PX);
  const canvasHeight = Math.round(paper.heightMm * MM_TO_PX);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Fill page background
    ctx.fillStyle = project.theme.background || '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const isOdd = (pageIndex + 1) % 2 === 1;
    const leftMm = isOdd ? project.margins.innerGutterMm : project.margins.outerMm;
    const rightMm = isOdd ? project.margins.outerMm : project.margins.innerGutterMm;
    const topMm = project.margins.topMm;
    const bottomMm = project.margins.bottomMm;

    const leftPx = leftMm * MM_TO_PX;
    const rightPx = rightMm * MM_TO_PX;
    const topPx = topMm * MM_TO_PX;
    const bottomPx = bottomMm * MM_TO_PX;
    const printableWidth = canvasWidth - leftPx - rightPx;
    const printableHeight = canvasHeight - topPx - bottomPx;

    // 2. Render Pattern if enabled
    const isCover = page.template === 'cover';
    const isContent = !isCover && page.template !== 'belongs_to' && page.template !== 'copyright';
    const shouldDrawPattern =
      project.pattern &&
      (project.pattern.applyTo === 'all' ||
        (project.pattern.applyTo === 'cover_only' && isCover) ||
        (project.pattern.applyTo === 'content_only' && isContent));

    if (shouldDrawPattern && (project.pattern.dataUrl || project.pattern.svgData)) {
      const patternImg = new Image();
      patternImg.crossOrigin = 'anonymous';
      patternImg.onload = () => {
        ctx.save();
        ctx.globalAlpha = project.pattern.opacity;

        const tilePx = Math.max(16, (120 * project.pattern.scale * scaleFactor) / 100);

        if (project.pattern.repeat === 'no-repeat') {
          const cx = (canvasWidth - tilePx) / 2;
          const cy = (canvasHeight - tilePx) / 2;
          ctx.drawImage(patternImg, cx, cy, tilePx, tilePx);
        } else if (project.pattern.repeat === 'repeat-x') {
          const cy = (canvasHeight - tilePx) / 2;
          for (let x = 0; x < canvasWidth; x += tilePx) {
            ctx.drawImage(patternImg, x, cy, tilePx, tilePx);
          }
        } else if (project.pattern.repeat === 'repeat-y') {
          const cx = (canvasWidth - tilePx) / 2;
          for (let y = 0; y < canvasHeight; y += tilePx) {
            ctx.drawImage(patternImg, cx, y, tilePx, tilePx);
          }
        } else if (project.pattern.repeat === 'stagger') {
          let row = 0;
          for (let y = 0; y < canvasHeight; y += tilePx) {
            const xOffset = row % 2 === 1 ? tilePx / 2 : 0;
            for (let x = -tilePx; x < canvasWidth + tilePx; x += tilePx) {
              ctx.drawImage(patternImg, x + xOffset, y, tilePx, tilePx);
            }
            row++;
          }
        } else {
          // repeat all
          for (let y = 0; y < canvasHeight; y += tilePx) {
            for (let x = 0; x < canvasWidth; x += tilePx) {
              ctx.drawImage(patternImg, x, y, tilePx, tilePx);
            }
          }
        }
        ctx.restore();

        // Continue rendering overlay text and lines after pattern loads
        drawForegroundElements(ctx, isOdd, leftPx, rightPx, topPx, bottomPx, printableWidth, printableHeight);
      };

      patternImg.src = project.pattern.dataUrl || project.pattern.svgData!;
    } else {
      drawForegroundElements(ctx, isOdd, leftPx, rightPx, topPx, bottomPx, printableWidth, printableHeight);
    }

    function drawForegroundElements(
      c: CanvasRenderingContext2D,
      odd: boolean,
      lPx: number,
      rPx: number,
      tPx: number,
      bPx: number,
      pWidth: number,
      pHeight: number
    ) {
      // Draw template specific graphics
      renderTemplateCanvas(c, page, project, lPx, rPx, tPx, bPx, pWidth, pHeight, MM_TO_PX, canvasWidth, canvasHeight);

      // Page Numbering
      const isFront = page.template === 'cover' || page.template === 'copyright' || page.template === 'belongs_to';
      if (project.numbering.enabled && (!project.numbering.skipCoverAndCopyright || !isFront) && !page.excludeNumbering) {
        c.font = `400 ${Math.max(9, 11 * scaleFactor)}px ${project.theme.bodyFont || 'sans-serif'}`;
        c.fillStyle = project.theme.secondary;
        c.textAlign = 'center';
        let numStr = `${pageIndex + 1}`;
        if (project.numbering.format === '- 1 -') numStr = `- ${pageIndex + 1} -`;
        if (project.numbering.format === 'Page 1') numStr = `Page ${pageIndex + 1}`;
        if (project.numbering.format === '1 / N') numStr = `${pageIndex + 1} / ${totalPages}`;

        const numY = canvasHeight - (bPx / 2);
        let numX = canvasWidth / 2;
        if (project.numbering.position === 'bottom-outer') {
          numX = odd ? canvasWidth - rPx : lPx;
          c.textAlign = odd ? 'right' : 'left';
        } else if (project.numbering.position === 'top-right') {
          numX = canvasWidth - rPx;
          c.textAlign = 'right';
        }
        c.fillText(numStr, numX, numY);
      }

      // Draw guides if enabled
      if (showGuides) {
        c.save();
        // Inner printable border
        c.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        c.setLineDash([4, 4]);
        c.lineWidth = 1;
        c.strokeRect(lPx, tPx, pWidth, pHeight);

        // Gutter indicator strip
        c.fillStyle = 'rgba(239, 68, 68, 0.07)';
        if (odd) {
          c.fillRect(0, 0, lPx, canvasHeight); // Left gutter
        } else {
          c.fillRect(canvasWidth - rPx, 0, rPx, canvasHeight); // Right gutter
        }

        // Bleed line indicator (3.175mm outer border)
        const bleedPx = project.margins.bleedMm * MM_TO_PX;
        c.strokeStyle = 'rgba(244, 63, 94, 0.35)';
        c.setLineDash([2, 2]);
        c.strokeRect(bleedPx, bleedPx, canvasWidth - 2 * bleedPx, canvasHeight - 2 * bleedPx);

        c.restore();
      }
    }
  }, [page, pageIndex, totalPages, project, showGuides, scaleFactor, canvasWidth, canvasHeight]);

  return (
    <div className="relative inline-block rounded shadow-md border border-neutral-300 dark:border-neutral-700 overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
        className="block"
      />
    </div>
  );
};

function renderTemplateCanvas(
  ctx: CanvasRenderingContext2D,
  page: JournalPage,
  project: ProjectData,
  left: number,
  right: number,
  top: number,
  bottom: number,
  width: number,
  height: number,
  mmToPx: number,
  cWidth: number,
  cHeight: number
) {
  const primary = project.theme.primary;
  const secondary = project.theme.secondary;
  const headingFont = project.theme.headingFont;
  const bodyFont = project.theme.bodyFont;

  switch (page.template) {
    case 'cover': {
      // Cover borders
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(left + 6, top + 6, width - 12, height - 12);
      ctx.lineWidth = 1;
      ctx.strokeRect(left + 14, top + 14, width - 28, height - 28);

      // Edition badge
      if (project.cover.editionBadge) {
        ctx.font = `600 11px ${bodyFont}`;
        ctx.fillStyle = secondary;
        ctx.textAlign = 'center';
        ctx.fillText(project.cover.editionBadge.toUpperCase(), cWidth / 2, top + 50);
      }

      // Title
      ctx.font = `700 24px ${headingFont}`;
      ctx.fillStyle = primary;
      ctx.textAlign = 'center';
      wrapText(ctx, project.cover.title || 'JOURNAL', cWidth / 2, top + 110, width - 40, 32);

      // Subtitle
      ctx.font = `italic 14px ${headingFont}`;
      ctx.fillStyle = secondary;
      wrapText(ctx, project.cover.subtitle || '', cWidth / 2, top + 190, width - 40, 22);

      // Author
      ctx.font = `600 13px ${bodyFont}`;
      ctx.fillStyle = primary;
      ctx.fillText(project.cover.authorOrBrand.toUpperCase(), cWidth / 2, cHeight - bottom - 40);
      break;
    }

    case 'belongs_to': {
      ctx.font = `700 22px ${headingFont}`;
      ctx.fillStyle = primary;
      ctx.textAlign = 'center';
      ctx.fillText(page.title || 'This Journal Belongs To', cWidth / 2, top + 80);

      // Ornamental line
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cWidth / 2 - 40, top + 95);
      ctx.lineTo(cWidth / 2 + 40, top + 95);
      ctx.stroke();

      const labels = ['Name:', 'Email:', 'Phone:', 'Address:'];
      const startY = top + 150;
      const step = 45;

      labels.forEach((lbl, idx) => {
        const y = startY + (idx * step);
        ctx.font = `500 13px ${bodyFont}`;
        ctx.fillStyle = secondary;
        ctx.textAlign = 'left';
        ctx.fillText(lbl, left + 20, y - 6);

        ctx.strokeStyle = secondary;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left + 85, y);
        ctx.lineTo(cWidth - right - 20, y);
        ctx.stroke();
      });

      if (page.promptOrText) {
        ctx.font = `italic 12px ${bodyFont}`;
        ctx.fillStyle = secondary;
        ctx.textAlign = 'center';
        wrapText(ctx, page.promptOrText, cWidth / 2, startY + (labels.length * step) + 40, width - 40, 18);
      }
      break;
    }

    case 'copyright': {
      ctx.textAlign = 'left';
      ctx.font = `700 16px ${headingFont}`;
      ctx.fillStyle = primary;
      ctx.fillText(project.copyright.bookTitle, left + 10, top + 70);

      ctx.font = `400 12px ${bodyFont}`;
      ctx.fillStyle = secondary;
      ctx.fillText(project.copyright.edition, left + 10, top + 92);

      let curY = top + 130;
      const step = 18;

      ctx.fillStyle = primary;
      ctx.fillText(`Published by: ${project.copyright.authorOrPublisher}`, left + 10, curY);
      curY += step;
      ctx.fillText(`Copyright © ${project.copyright.publishedYear} ${project.copyright.authorOrPublisher}`, left + 10, curY);
      curY += step;
      if (project.cover.isbn) {
        ctx.fillText(`ISBN: ${project.cover.isbn}`, left + 10, curY);
        curY += step;
      }
      if (project.copyright.printedLocation) {
        ctx.fillText(project.copyright.printedLocation, left + 10, curY);
        curY += step;
      }
      if (project.copyright.contactWebsite) {
        ctx.fillText(`Website: ${project.copyright.contactWebsite}`, left + 10, curY);
        curY += step + 10;
      }

      ctx.font = `italic 11px ${bodyFont}`;
      ctx.fillStyle = secondary;
      wrapText(ctx, project.copyright.disclaimer, left + 10, curY, width - 20, 17);
      break;
    }

    case 'lined': {
      renderCanvasHeader(ctx, page, left, top, width, headingFont, bodyFont, primary, secondary);

      const lineStep = (page.lineSpacingMm || 7) * mmToPx;
      const startY = top + (page.promptOrText ? 85 : 60);
      const endY = cHeight - bottom - 15;

      ctx.strokeStyle = secondary;
      ctx.lineWidth = 0.8;

      for (let y = startY; y <= endY; y += lineStep) {
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(cWidth - right, y);
        ctx.stroke();
      }
      break;
    }

    case 'dot_grid': {
      renderCanvasHeader(ctx, page, left, top, width, headingFont, bodyFont, primary, secondary);

      const spacing = (page.gridSpacingMm || 5) * mmToPx;
      const startY = top + 60;
      const endY = cHeight - bottom - 15;
      const startX = left + ((width % spacing) / 2);
      const endX = cWidth - right;

      ctx.fillStyle = secondary;

      for (let y = startY; y <= endY; y += spacing) {
        for (let x = startX; x <= endX; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'grid': {
      renderCanvasHeader(ctx, page, left, top, width, headingFont, bodyFont, primary, secondary);

      const spacing = (page.gridSpacingMm || 5) * mmToPx;
      const startY = top + 60;
      const endY = cHeight - bottom - 15;
      const startX = left;
      const endX = cWidth - right;

      ctx.strokeStyle = secondary;
      ctx.lineWidth = 0.5;

      for (let x = startX; x <= endX; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
      break;
    }

    case 'weekly_planner': {
      renderCanvasHeader(ctx, page, left, top, width, headingFont, bodyFont, primary, secondary);

      const startY = top + 65;
      const colWidth = (width - 12) / 2;
      const boxHeight = (cHeight - bottom - startY - 20) / 3;
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekend & Notes'];

      days.forEach((day, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = left + (col * (colWidth + 12));
        const by = startY + (row * (boxHeight + 10));

        ctx.strokeStyle = secondary;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, colWidth, boxHeight);

        // Header
        ctx.fillStyle = secondary;
        ctx.fillRect(bx, by, colWidth, 20);

        ctx.font = `600 11px ${bodyFont}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(day.toUpperCase(), bx + 8, by + 14);

        // Lines inside
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 0.5;
        for (let ly = by + 36; ly < by + boxHeight - 8; ly += 18) {
          ctx.beginPath();
          ctx.moveTo(bx + 6, ly);
          ctx.lineTo(bx + colWidth - 6, ly);
          ctx.stroke();
        }
      });
      break;
    }

    case 'habit_tracker': {
      renderCanvasHeader(ctx, page, left, top, width, headingFont, bodyFont, primary, secondary);

      const startY = top + 75;
      const rowHeight = 26;
      const habitsCount = 12;
      const habitColWidth = Math.min(130, width * 0.35);
      const daysCount = 31;
      const dayCellWidth = (width - habitColWidth) / daysCount;

      ctx.font = `700 10px ${bodyFont}`;
      ctx.fillStyle = primary;
      ctx.textAlign = 'left';
      ctx.fillText('HABIT / ROUTINE', left + 6, startY - 8);

      for (let d = 1; d <= daysCount; d++) {
        const cx = left + habitColWidth + ((d - 1) * dayCellWidth);
        ctx.textAlign = 'center';
        ctx.fillText(`${d}`, cx + (dayCellWidth / 2), startY - 8);
      }

      ctx.strokeStyle = secondary;
      ctx.lineWidth = 0.8;
      for (let r = 0; r < habitsCount; r++) {
        const ry = startY + (r * rowHeight);
        ctx.strokeRect(left, ry, width, rowHeight);
        ctx.beginPath();
        ctx.moveTo(left + habitColWidth, ry);
        ctx.lineTo(left + habitColWidth, ry + rowHeight);
        ctx.stroke();

        for (let d = 1; d <= daysCount; d++) {
          const cx = left + habitColWidth + (d * dayCellWidth);
          ctx.beginPath();
          ctx.moveTo(cx, ry);
          ctx.lineTo(cx, ry + rowHeight);
          ctx.stroke();
        }
      }
      break;
    }

    case 'gratitude': {
      renderCanvasHeader(ctx, page, left, top, width, headingFont, bodyFont, primary, secondary);

      const sections = [
        { label: '3 Things I Am Deeply Grateful For Today:', lines: 3 },
        { label: 'What Would Make Today Fulfilling & Peaceful?', lines: 3 },
        { label: 'Daily Affirmation & Mental Clarity:', lines: 2 },
        { label: 'Evening Reflection & Wins:', lines: 4 },
      ];

      let curY = top + 75;
      const lineStep = 24;

      sections.forEach((sec) => {
        ctx.font = `700 12px ${headingFont}`;
        ctx.fillStyle = primary;
        ctx.textAlign = 'left';
        ctx.fillText(sec.label.toUpperCase(), left + 4, curY);
        curY += 14;

        ctx.strokeStyle = secondary;
        ctx.lineWidth = 0.8;
        for (let l = 0; l < sec.lines; l++) {
          curY += lineStep;
          ctx.beginPath();
          ctx.moveTo(left + 4, curY);
          ctx.lineTo(cWidth - right - 4, curY);
          ctx.stroke();
        }
        curY += 22;
      });
      break;
    }

    case 'blank_framed': {
      renderCanvasHeader(ctx, page, left, top, width, headingFont, bodyFont, primary, secondary);

      const startY = top + 70;
      const frameHeight = cHeight - bottom - startY - 20;

      ctx.strokeStyle = secondary;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(left, startY, width, frameHeight);

      // Ornamental corners
      const corner = 12;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(left + 6, startY + 6 + corner);
      ctx.lineTo(left + 6, startY + 6);
      ctx.lineTo(left + 6 + corner, startY + 6);

      ctx.moveTo(left + width - 6 - corner, startY + 6);
      ctx.lineTo(left + width - 6, startY + 6);
      ctx.lineTo(left + width - 6, startY + 6 + corner);

      ctx.moveTo(left + 6, startY + frameHeight - 6 - corner);
      ctx.lineTo(left + 6, startY + frameHeight - 6);
      ctx.lineTo(left + 6 + corner, startY + frameHeight - 6);

      ctx.moveTo(left + width - 6 - corner, startY + frameHeight - 6);
      ctx.lineTo(left + width - 6, startY + frameHeight - 6);
      ctx.lineTo(left + width - 6, startY + frameHeight - 6 - corner);
      ctx.stroke();
      break;
    }

    default:
      renderCanvasHeader(ctx, page, left, top, width, headingFont, bodyFont, primary, secondary);
      break;
  }
}

function renderCanvasHeader(
  ctx: CanvasRenderingContext2D,
  page: JournalPage,
  left: number,
  top: number,
  width: number,
  headingFont: string,
  bodyFont: string,
  primary: string,
  secondary: string
) {
  ctx.textAlign = 'left';
  ctx.font = `700 16px ${headingFont}`;
  ctx.fillStyle = primary;
  ctx.fillText(page.title, left, top + 20);

  ctx.textAlign = 'right';
  ctx.font = `400 11px ${bodyFont}`;
  ctx.fillStyle = secondary;
  ctx.fillText('Date: ____________', left + width, top + 20);

  let nextY = top + 38;
  if (page.promptOrText) {
    ctx.textAlign = 'left';
    ctx.font = `italic 12px ${bodyFont}`;
    ctx.fillStyle = secondary;
    wrapText(ctx, page.promptOrText, left, nextY, width, 16);
    nextY += 22;
  }

  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, nextY);
  ctx.lineTo(left + width, nextY);
  ctx.stroke();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = (text || '').split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}
