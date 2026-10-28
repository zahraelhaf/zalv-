/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ProjectData,
  PaperSize,
  PatternConfig,
  ThemeConfig,
  JournalPage,
  CoverConfig,
  CopyrightConfig,
  MarginsConfig,
  PAPER_SIZES,
} from './types/journal';
import {
  INITIAL_DEFAULT_PROJECT,
  loadProjectsFromStorage,
  saveProjectsToStorage,
  getActiveProjectId,
  setActiveProjectId,
} from './utils/storage';
import { exportProjectToJson, downloadJsonFile, validateAndSanitizeImport } from './utils/portability';
import { generateJournalPdf } from './utils/pdfGenerator';
import { PatternEditor } from './components/PatternEditor';
import { ThemeEditor } from './components/ThemeEditor';
import { PagesEditor } from './components/PagesEditor';
import { CoverCopyrightEditor } from './components/CoverCopyrightEditor';
import { CommercialHub } from './components/CommercialHub';
import { AuditPanel } from './components/AuditPanel';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { JournalPageCanvas } from './components/JournalPageCanvas';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Palette,
  Layers,
  BookMarked,
  ShoppingBag,
  ShieldCheck,
  Download,
  Eye,
  FileUp,
  FileDown,
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<Record<string, ProjectData>>(() => loadProjectsFromStorage());
  const [activeId, setActiveId] = useState<string>(() => getActiveProjectId());
  const [activeTab, setActiveTab] = useState<
    'pattern' | 'theme' | 'pages' | 'cover' | 'commercial' | 'audit'
  >('pattern');
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [saveIndicator, setSaveIndicator] = useState<boolean>(false);

  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Retrieve current active project, fallback to default
  const activeProject: ProjectData = projects[activeId] || Object.values(projects)[0] || INITIAL_DEFAULT_PROJECT;

  // Sync to localStorage whenever projects state changes
  useEffect(() => {
    saveProjectsToStorage(projects);
    setActiveProjectId(activeId);
  }, [projects, activeId]);

  // Update helper for active project
  const updateActiveProject = (updated: ProjectData) => {
    const withDate = { ...updated, updatedAt: new Date().toISOString() };
    setProjects((prev) => ({
      ...prev,
      [activeId]: withDate,
    }));
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  };

  // Specific updaters
  const handleUpdatePattern = (pattern: PatternConfig) => {
    updateActiveProject({ ...activeProject, pattern });
  };

  const handleUpdateTheme = (theme: ThemeConfig) => {
    // Non-destructive: preserves existing pages, prompts, notes, cover, pattern!
    updateActiveProject({ ...activeProject, theme });
  };

  const handleUpdatePaperSize = (paperSize: PaperSize) => {
    updateActiveProject({ ...activeProject, paperSize });
  };

  const handleUpdatePages = (pages: JournalPage[]) => {
    updateActiveProject({ ...activeProject, pages });
  };

  const handleUpdateCover = (cover: CoverConfig) => {
    updateActiveProject({ ...activeProject, cover });
  };

  const handleUpdateCopyright = (copyright: CopyrightConfig) => {
    updateActiveProject({ ...activeProject, copyright });
  };

  const handleUpdateMargins = (margins: MarginsConfig) => {
    updateActiveProject({ ...activeProject, margins });
  };

  const handleUpdateNumbering = (numbering: ProjectData['numbering']) => {
    updateActiveProject({ ...activeProject, numbering });
  };

  const handleUpdateMultiplier = (pageCountMultiplier: number) => {
    updateActiveProject({ ...activeProject, pageCountMultiplier });
  };

  const handleUpdateCommercial = (commercial: ProjectData['commercial']) => {
    updateActiveProject({ ...activeProject, commercial });
  };

  // Project Management Actions
  const handleCreateNewProject = () => {
    const newId = `proj_${Date.now()}`;
    const newProj: ProjectData = {
      ...INITIAL_DEFAULT_PROJECT,
      id: newId,
      name: `Untitled Journal ${Object.keys(projects).length + 1}`,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => ({ ...prev, [newId]: newProj }));
    setActiveId(newId);
    setActivePageIndex(0);
  };

  const handleDuplicateProject = () => {
    const dupId = `proj_dup_${Date.now()}`;
    const duplicated: ProjectData = {
      ...JSON.parse(JSON.stringify(activeProject)),
      id: dupId,
      name: `${activeProject.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => ({ ...prev, [dupId]: duplicated }));
    setActiveId(dupId);
  };

  const handleDeleteProject = () => {
    const projectKeys = Object.keys(projects);
    if (projectKeys.length <= 1) {
      alert('You must keep at least one project.');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${activeProject.name}"?`)) return;

    const remaining = { ...projects };
    delete remaining[activeId];
    const nextActiveId = Object.keys(remaining)[0];
    setProjects(remaining);
    setActiveId(nextActiveId);
    setActivePageIndex(0);
  };

  const handleExportJson = () => {
    const json = exportProjectToJson(activeProject);
    const filename = `${activeProject.name.toLowerCase().replace(/\s+/g, '_')}_project.json`;
    downloadJsonFile(filename, json);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = loadEvent.target?.result as string;
      const res = validateAndSanitizeImport(content);
      if (!res.valid || !res.sanitizedProject) {
        alert(`Import Error:\n${res.errors.join('\n')}`);
        return;
      }

      if (res.warnings.length > 0) {
        alert(`Notice during import:\n${res.warnings.join('\n')}`);
      }

      const importedProj = res.sanitizedProject;
      setProjects((prev) => ({ ...prev, [importedProj.id]: importedProj }));
      setActiveId(importedProj.id);
      setActivePageIndex(0);

      confetti({ particleCount: 50, spread: 60 });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleQuickDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const doc = await generateJournalPdf(activeProject);
      const filename = `${activeProject.name.toLowerCase().replace(/\s+/g, '_')}_${activeProject.paperSize}.pdf`;
      doc.save(filename);
      confetti({ particleCount: 70, spread: 70 });
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF generation encountered an error.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const paper = PAPER_SIZES[activeProject.paperSize];
  const pages = activeProject.pages;
  const currentPage = pages[activePageIndex] || pages[0];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="bg-white dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight">Pattern Journal Studio</h1>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  Commercial Edition
                </span>
                {saveIndicator && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                Custom Motif & Paperback Planner Publishing Engine
              </p>
            </div>
          </div>

          {/* Project Switcher & Inline Name Editor */}
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-neutral-200 dark:border-neutral-800">
            <select
              value={activeId}
              onChange={(e) => {
                setActiveId(e.target.value);
                setActivePageIndex(0);
              }}
              className="text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-neutral-800 dark:text-neutral-200"
            >
              {Object.values(projects).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={activeProject.name}
              onChange={(e) => updateActiveProject({ ...activeProject, name: e.target.value })}
              className="text-xs rounded-md border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 px-2 py-1 font-medium bg-transparent focus:bg-white dark:focus:bg-neutral-800 focus:border-indigo-500 w-44"
              title="Click to rename project"
            />

            <button
              type="button"
              onClick={handleCreateNewProject}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Create New Journal Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDuplicateProject}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Duplicate Active Project"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDeleteProject}
              className="p-1.5 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
              title="Delete Project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* JSON Portability (Audit #4) */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 rounded transition"
              title="Export complete project data and custom pattern assets to portable JSON"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-500" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 rounded transition"
              title="Import project JSON bundle"
            >
              <FileUp className="w-3.5 h-3.5 text-indigo-500" />
              Import JSON
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJson}
            />
          </div>

          {/* Interactive PDF Proofing (Audit #3 & #5) */}
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition"
          >
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            Proof Spread View
          </button>

          {/* Direct Download PDF */}
          <button
            type="button"
            onClick={handleQuickDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition disabled:opacity-50"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> Download PDF
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Editor Panels & Tabs */}
        <aside className="w-full md:w-[460px] lg:w-[500px] border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 flex flex-col shrink-0">
          {/* Main Navigation Tabs */}
          <nav className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 pt-2 gap-1 overflow-x-auto shrink-0">
            {[
              { id: 'pattern', label: 'Pattern', icon: Sparkles },
              { id: 'theme', label: 'Theme & Size', icon: Palette },
              { id: 'pages', label: 'Pages', icon: Layers },
              { id: 'cover', label: 'Cover & Spine', icon: BookMarked },
              { id: 'commercial', label: 'Commercial', icon: ShoppingBag },
              { id: 'audit', label: 'Audit Suite', icon: ShieldCheck, badge: 'Verified' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 rounded-t-md transition whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-neutral-850'
                      : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active Tab Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'pattern' && (
              <PatternEditor pattern={activeProject.pattern} onChange={handleUpdatePattern} />
            )}
            {activeTab === 'theme' && (
              <ThemeEditor
                theme={activeProject.theme}
                paperSize={activeProject.paperSize}
                onThemeChange={handleUpdateTheme}
                onPaperSizeChange={handleUpdatePaperSize}
              />
            )}
            {activeTab === 'pages' && (
              <PagesEditor
                project={activeProject}
                activePageIndex={activePageIndex}
                onSelectPageIndex={setActivePageIndex}
                onUpdatePages={handleUpdatePages}
                onUpdateMargins={handleUpdateMargins}
                onUpdateNumbering={handleUpdateNumbering}
                onUpdateMultiplier={handleUpdateMultiplier}
              />
            )}
            {activeTab === 'cover' && (
              <CoverCopyrightEditor
                project={activeProject}
                onUpdateCover={handleUpdateCover}
                onUpdateCopyright={handleUpdateCopyright}
              />
            )}
            {activeTab === 'commercial' && (
              <CommercialHub project={activeProject} onUpdateCommercial={handleUpdateCommercial} />
            )}
            {activeTab === 'audit' && <AuditPanel project={activeProject} />}
          </div>
        </aside>

        {/* Right Side: Live Page Visualizer */}
        <main className="flex-1 bg-neutral-200/60 dark:bg-neutral-950 flex flex-col overflow-hidden relative">
          {/* Top Canvas Bar */}
          <div className="px-6 py-2.5 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xs border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                Live Canvas: {currentPage.title}
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">
                {paper.name} ({paper.widthMm} × {paper.heightMm} mm)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowGuides(!showGuides)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition flex items-center gap-1 ${
                  showGuides
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                Guides {showGuides ? 'On' : 'Off'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={activePageIndex === 0}
                  onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
                  className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 px-1.5">
                  Page {activePageIndex + 1} / {pages.length}
                </span>
                <button
                  type="button"
                  disabled={activePageIndex >= pages.length - 1}
                  onClick={() => setActivePageIndex(Math.min(pages.length - 1, activePageIndex + 1))}
                  className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Eye className="w-3.5 h-3.5" />
                Open 2-Page Proof
              </button>
            </div>
          </div>

          {/* Canvas Center Stage */}
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
            <JournalPageCanvas
              page={currentPage}
              pageIndex={activePageIndex}
              totalPages={pages.length}
              project={activeProject}
              showGuides={showGuides}
              scaleFactor={1.0}
            />
          </div>

          {/* Quick Info Footer Bar */}
          <footer className="px-6 py-2 bg-white/80 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <span>
                Theme: <strong className="text-neutral-800 dark:text-neutral-200">{activeProject.theme.name}</strong>
              </span>
              <span>
                Pattern:{' '}
                <strong className="text-neutral-800 dark:text-neutral-200">
                  {activeProject.pattern.name} ({activeProject.pattern.repeat}, {activeProject.pattern.scale}%)
                </strong>
              </span>
              <span>
                Gutter Margin:{' '}
                <strong className="text-neutral-800 dark:text-neutral-200">
                  {activeProject.margins.innerGutterMm} mm
                </strong>
              </span>
            </div>

            <div>
              <span>
                Target Volume:{' '}
                <strong className="text-neutral-800 dark:text-neutral-200">
                  {pages.length * (activeProject.pageCountMultiplier || 1)} Pages ({activeProject.pageCountMultiplier}x multiplier)
                </strong>
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* PDF Proofing & Download Modal */}
      <PdfPreviewModal
        project={activeProject}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </div>
  );
}
