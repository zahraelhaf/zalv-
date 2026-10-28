import React, { useState } from 'react';
import { ProjectData, PAPER_SIZES } from '../types/journal';
import { JournalPageCanvas } from './JournalPageCanvas';
import { generateJournalPdf, PdfGenerationProgress } from '../utils/pdfGenerator';
import confetti from 'canvas-confetti';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
  Eye,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Loader2,
} from 'lucide-react';

interface PdfPreviewModalProps {
  project: ProjectData;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ project, isOpen, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [spreadMode, setSpreadMode] = useState<boolean>(false);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<PdfGenerationProgress | null>(null);

  if (!isOpen) return null;

  const paper = PAPER_SIZES[project.paperSize];
  const pages = project.pages;
  const totalPages = pages.length;

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      setProgress({ currentPage: 0, totalPages, stage: 'Preparing document...' });

      const doc = await generateJournalPdf(project, (prog) => {
        setProgress(prog);
      });

      const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_${project.paperSize}.pdf`;
      doc.save(filename);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  const currentPage = pages[currentIdx];
  const nextIdx = currentIdx + 1 < totalPages ? currentIdx + 1 : null;
  const nextPage = nextIdx !== null ? pages[nextIdx] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-semibold">Interactive PDF Proofing & Print Inspector</h2>
              <p className="text-xs text-neutral-400">
                {paper.name} ({paper.widthMm} × {paper.heightMm} mm) • Page {currentIdx + 1} of {totalPages}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs transition shadow-sm disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Print-Ready PDF
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="px-6 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSpreadMode(!spreadMode)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition flex items-center gap-1.5 ${
                spreadMode
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                  : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {spreadMode ? '2-Page Book Spread' : 'Single Page'}
            </button>

            <button
              type="button"
              onClick={() => setShowGuides(!showGuides)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition flex items-center gap-1.5 ${
                showGuides
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showGuides ? 'Guides: Visible' : 'Guides: Hidden'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
              <button
                type="button"
                onClick={() => setZoomScale(Math.max(0.6, zoomScale - 0.15))}
                className="p-1 hover:text-white text-neutral-400"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1">{Math.round(zoomScale * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomScale(Math.min(1.4, zoomScale + 0.15))}
                className="p-1 hover:text-white text-neutral-400"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - (spreadMode ? 2 : 1)))}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-neutral-400 px-1">
                {currentIdx + 1}
                {spreadMode && nextIdx !== null ? `-${nextIdx + 1}` : ''} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentIdx >= totalPages - 1}
                onClick={() => setCurrentIdx(Math.min(totalPages - 1, currentIdx + (spreadMode ? 2 : 1)))}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Display Viewport */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-neutral-950/80">
          {spreadMode ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <JournalPageCanvas
                  page={currentPage}
                  pageIndex={currentIdx}
                  totalPages={totalPages}
                  project={project}
                  showGuides={showGuides}
                  scaleFactor={zoomScale * 0.85}
                />
                <span className="text-[11px] text-neutral-400 mt-2 font-mono">Page {currentIdx + 1} (Verso / Left)</span>
              </div>
              {nextPage ? (
                <div className="flex flex-col items-center">
                  <JournalPageCanvas
                    page={nextPage}
                    pageIndex={nextIdx!}
                    totalPages={totalPages}
                    project={project}
                    showGuides={showGuides}
                    scaleFactor={zoomScale * 0.85}
                  />
                  <span className="text-[11px] text-neutral-400 mt-2 font-mono">Page {nextIdx! + 1} (Recto / Right)</span>
                </div>
              ) : (
                <div className="w-64 h-80 rounded border border-dashed border-neutral-800 flex items-center justify-center text-xs text-neutral-600">
                  End of Book
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <JournalPageCanvas
                page={currentPage}
                pageIndex={currentIdx}
                totalPages={totalPages}
                project={project}
                showGuides={showGuides}
                scaleFactor={zoomScale}
              />
              <span className="text-[11px] text-neutral-400 mt-2 font-mono">Page {currentIdx + 1} of {totalPages}</span>
            </div>
          )}
        </div>

        {/* Progress Bar if downloading */}
        {isExporting && progress && (
          <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400">{progress.stage}</span>
              <span className="font-mono text-emerald-400">
                {Math.round((progress.currentPage / Math.max(1, progress.totalPages)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-200"
                style={{
                  width: `${(progress.currentPage / Math.max(1, progress.totalPages)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
