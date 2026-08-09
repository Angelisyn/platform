'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Heading, Input, Spinner } from '@angelisyn/ui';
import { reportsService } from '@/services/reports.service';
import { projectsService } from '@/services/projects.service';
import type { Report } from '@/types/reports';
import type { Project } from '@/types/projects';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [reportsData, projectsData] = await Promise.all([
          reportsService.getAll(),
          projectsService.getAll(),
        ]);
        if (isMounted) {
          setReports(reportsData);
          setProjects(projectsData);
          if (projectsData.length > 0) {
            setSelectedProjectId(projectsData[0].id);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load assessment reports');
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim() || !selectedProjectId) return;

    try {
      setSubmitting(true);
      await reportsService.create({
        name: reportName,
        projectId: selectedProjectId,
      });
      setModalOpen(false);
      setReportName('');
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate report');
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Heading>Security Reports</Heading>
          <p className="mt-1 text-sm text-slate-400">
            Generate and export security posture assessment documentation.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Generate Report</Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading security reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-slate-400 space-y-4">
            <p className="text-lg font-medium text-slate-200">No reports generated yet</p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Compile target findings and local scan executive summaries into downloadable security assessment reports.
            </p>
            <Button onClick={() => setModalOpen(true)}>+ Generate Report</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                    <Badge>{report.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Generated: {new Date(report.generatedAt).toLocaleString()}
                  </p>

                  <div className="flex items-center gap-2 pt-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                      {report.findingsSummary.critical} Critical
                    </span>
                    <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800">
                      {report.findingsSummary.high} High
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      {report.findingsSummary.medium} Medium
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportReport(report)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                  >
                    Export JSON Summary
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
              <h2 className="text-lg font-semibold text-white">Generate Executive Report</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Report Document Title
                </label>
                <Input
                  placeholder="e.g. Q3 Security Assessment Report"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Project Scope
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Compile Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
