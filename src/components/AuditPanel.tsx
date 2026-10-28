import React, { useState, useEffect } from 'react';
import { ProjectData } from '../types/journal';
import { runFullAuditSuite, AuditSuiteResult } from '../tests/auditRunner';
import { downloadTextFile } from '../utils/portability';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  FileDown,
  RefreshCw,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';

interface AuditPanelProps {
  project: ProjectData;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ project }) => {
  const [suiteResult, setSuiteResult] = useState<AuditSuiteResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const res = await runFullAuditSuite(project);
      setSuiteResult(res);
    } catch (err) {
      console.error('Audit execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, [project]);

  const items = suiteResult?.items || [];
  const filtered = items.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: 'PASS' | 'FAIL' | 'NOT TESTED') => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-300 dark:border-red-800">
            <XCircle className="w-3 h-3 text-red-600" /> FAIL
          </span>
        );
      case 'NOT TESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <HelpCircle className="w-3 h-3 text-amber-600" /> NOT TESTED
          </span>
        );
    }
  };

  const generateMarkdownReport = () => {
    if (!suiteResult) return '';
    const lines = [
      `# Pattern Journal Studio - Audit Report`,
      `**Generated:** ${new Date(suiteResult.timestamp).toLocaleString()}`,
      `**Total Checks:** ${suiteResult.totalChecks} | **PASS:** ${suiteResult.passedCount} | **FAIL:** ${suiteResult.failedCount} | **NOT TESTED:** ${suiteResult.notTestedCount}`,
      ``,
      `| Category | Requirement / Feature | Status | Finding / Verification |`,
      `|---|---|---|---|`,
      ...suiteResult.items.map(
        (i) =>
          `| **${i.category.toUpperCase()}** | ${i.title} | **${i.status}** | ${i.finding.replace(/\|/g, '-')} |`
      ),
      ``,
      `## Remediation Summary`,
      ...suiteResult.items
        .filter((i) => i.resolution)
        .map((i) => `- **${i.title}**: ${i.resolution}`),
    ];
    return lines.join('\n');
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    downloadTextFile('pattern_journal_audit_report.md', generateMarkdownReport());
  };

  return (
    <div className="space-y-6">
      {/* Top Scorecard Banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-5 rounded-2xl shadow-sm border border-neutral-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Production Quality & Compliance Audit</h3>
              <p className="text-xs text-neutral-400">
                Live verification across Custom Pattern, Data Integrity, PDF Quality, Portability & Commercial Readiness
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runAudit}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-700 hover:bg-neutral-600 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              Re-run Audit
            </button>
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-700 hover:bg-neutral-600 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download .MD
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 pt-2 border-t border-neutral-700/60">
          <div className="bg-neutral-800/80 p-3 rounded-xl border border-neutral-700/50">
            <div className="text-[11px] text-neutral-400">Total Audit Items</div>
            <div className="text-xl font-bold font-mono">{suiteResult?.totalChecks || 0}</div>
          </div>
          <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/40 text-emerald-300">
            <div className="text-[11px] text-emerald-400 font-medium">PASS Verified</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{suiteResult?.passedCount || 0}</div>
          </div>
          <div className="bg-red-950/30 p-3 rounded-xl border border-red-800/40 text-red-300">
            <div className="text-[11px] text-red-400 font-medium">FAIL (Defects)</div>
            <div className="text-xl font-bold font-mono text-red-400">{suiteResult?.failedCount || 0}</div>
          </div>
          <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-800/40 text-amber-300">
            <div className="text-[11px] text-amber-400 font-medium">NOT TESTED</div>
            <div className="text-xl font-bold font-mono text-amber-400">{suiteResult?.notTestedCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          {[
            { id: 'all', label: 'All 5 Aspects' },
            { id: 'custom_pattern', label: '1. Custom Pattern' },
            { id: 'data_integrity', label: '2. Data Integrity' },
            { id: 'pdf_quality', label: '3. PDF Quality' },
            { id: 'project_portability', label: '4. Portability' },
            { id: 'commercial_readiness', label: '5. Commercial' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filterCategory === cat.id
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-neutral-400 font-medium">Status:</span>
          {(['all', 'PASS', 'FAIL', 'NOT TESTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filterStatus === st
                  ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Checklist Table */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border transition bg-white dark:bg-neutral-850 ${
              item.status === 'PASS'
                ? 'border-neutral-200 dark:border-neutral-700/80'
                : item.status === 'FAIL'
                ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10'
                : 'border-amber-200 dark:border-amber-900/60'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    [{item.category.replace('_', ' ')}]
                  </span>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {item.title}
                  </h4>
                </div>
                <p className="text-[11px] text-neutral-500">{item.requirement}</p>
              </div>
              <div>{getStatusBadge(item.status)}</div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <div className="text-neutral-700 dark:text-neutral-300 flex items-start gap-1.5">
                <span className="font-semibold text-neutral-500 shrink-0">Finding:</span>
                <span>{item.finding}</span>
              </div>
              {item.resolution && (
                <div className="mt-1 text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
                  <span className="font-semibold shrink-0">Resolution:</span>
                  <span>{item.resolution}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-neutral-400 text-xs">
            No audit items matching selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
