'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Input, Spinner } from '@angelisyn/ui';
import { PageHeader } from '@/components/dashboard/page-header';
import { reportsService } from '@/services/reports.service';
import { projectsService } from '@/services/projects.service';
import { targetsService } from '@/services/targets.service';
import { isApiError } from '@/lib/api';
import type { Report } from '@/types/reports';
import type { Project } from '@/types/projects';
import type { Target } from '@/types/targets';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [reportsData, projectsData] = await Promise.all([
        reportsService.getAll(),
        projectsService.getAll(),
      ]);
      setReports(reportsData);
      setProjects(projectsData);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const [reportsData, projectsData] = await Promise.all([
          reportsService.getAll(),
          projectsService.getAll(),
        ]);
        if (isMounted) {
          setReports(reportsData);
          setProjects(projectsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            isApiError(err)
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Failed to load reports',
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void initialLoad();

    return () => { isMounted = false; };
  }, []);

  // Load targets when project selection changes
  useEffect(() => {
    if (!selectedProjectId) {
      // Clear targets on next tick to avoid synchronous setState in effect
      const timer = setTimeout(() => setTargets([]), 0);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    void targetsService.getByProject(selectedProjectId).then((data) => {
      if (!cancelled) setTargets(data);
    }).catch(() => {
      if (!cancelled) setTargets([]);
    });
    return () => { cancelled = true; };
  }, [selectedProjectId]);

  const openModal = () => {
    setCreateError(null);
    setReportName('');
    setSelectedProjectId(projects.length > 0 ? projects[0].id : '');
    setSelectedTargetId('');
    setModalOpen(true);
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim() || !selectedProjectId) return;

    try {
      setSubmitting(true);
      setCreateError(null);
      await reportsService.create({
        name: reportName,
        projectId: selectedProjectId,
        ...(selectedTargetId ? { targetId: selectedTargetId } : {}),
      });
      setModalOpen(false);
      setReportName('');
      await loadData();
    } catch (err) {
      if (isApiError(err)) {
        setCreateError(err.message);
      } else {
        setCreateError(err instanceof Error ? err.message : 'Failed to generate report');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportReport = (report: Report) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${report.name.toLowerCase().replace(/\s+/g, '_')}_summary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalFindings = (s: Report['findingsSummary']) => s.critical + s.high + s.medium + s.low + s.info;

  const filteredTargets = selectedProjectId
    ? targets.filter((t) => t.projectId === selectedProjectId)
    : targets;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Generate and export security posture assessment documentation."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
        ]}
        actions={<Button onClick={openModal}>+ Generate Report</Button>}
      />

      {error && (
        <Alert>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => void loadData()}
              className="ml-4 underline text-xs hover:text-white"
            >
              Retry
            </button>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-semibold text-white">No reports generated yet</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Compile target findings and scan executive summaries into downloadable security assessment reports.
          </p>
          <Button onClick={openModal}>+ Generate Report</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/reports/${report.id}`}
                      className="text-lg font-semibold text-white hover:text-blue-400"
                    >
                      {report.name}
                    </Link>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        report.status === 'READY'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : report.status === 'GENERATING'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                            : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Project: <strong className="text-slate-300">{report.projectName || report.projectId}</strong>
                    {report.targetName && (
                      <>
                        {' '}&bull; Target: <span className="text-blue-400 font-mono">{report.targetName}</span>
                      </>
                    )}
                    {' '}&bull; Generated: {new Date(report.generatedAt).toLocaleString()}
                  </p>

                  <div className="flex items-center gap-2 pt-2 text-xs flex-wrap">
                    {report.findingsSummary.critical > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                        {report.findingsSummary.critical} Critical
                      </span>
                    )}
                    {report.findingsSummary.high > 0 && (
                      <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800">
                        {report.findingsSummary.high} High
                      </span>
                    )}
                    {report.findingsSummary.medium > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        {report.findingsSummary.medium} Medium
                      </span>
                    )}
                    {report.findingsSummary.low > 0 && (
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        {report.findingsSummary.low} Low
                      </span>
                    )}
                    {report.findingsSummary.info > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {report.findingsSummary.info} Info
                      </span>
                    )}
                    <span className="text-slate-500 font-medium">
                      {totalFindings(report.findingsSummary)} total
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/dashboard/reports/${report.id}`}>
                    <button className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs transition-colors">
                      View Details &rarr;
                    </button>
                  </Link>
                  <button
                    onClick={() => handleExportReport(report)}
                    className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs transition-colors"
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-white">Generate Report</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {createError && <Alert>{createError}</Alert>}

            {projects.length === 0 ? (
              <div className="space-y-4 text-center py-4">
                <p className="text-sm text-slate-300">
                  You need to create a project before generating a report.
                </p>
                <Link href="/dashboard/projects">
                  <Button>Create a Project First</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={(e) => void handleCreateReport(e)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Report Title
                  </label>
                  <Input
                    placeholder="e.g. Q3 Security Assessment"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSelectedTargetId('');
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Target <span className="text-slate-500">(optional)</span>
                  </label>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Entire Project (all targets)</option>
                    {filteredTargets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.target})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
