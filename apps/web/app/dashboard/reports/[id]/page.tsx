'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Spinner } from '@angelisyn/ui';
import { PageHeader } from '@/components/dashboard/page-header';
import { reportsService } from '@/services/reports.service';
import { isApiError } from '@/lib/api';
import type { Report } from '@/types/reports';

function statusBadgeClass(status: string) {
  switch (status) {
    case 'READY':
      return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
    case 'GENERATING':
      return 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse';
    case 'FAILED':
      return 'bg-red-950 text-red-300 border border-red-800';
    default:
      return 'bg-slate-800 text-slate-400';
  }
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        setIsNotFound(false);
        const data = await reportsService.getById(id);
        if (isMounted) setReport(data);
      } catch (err) {
        if (isMounted) {
          if (isApiError(err) && err.isNotFound) {
            setIsNotFound(true);
          } else {
            setError(
              isApiError(err)
                ? err.message
                : err instanceof Error
                  ? err.message
                  : 'Failed to load report details',
            );
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadReport();

    return () => { isMounted = false; };
  }, [id]);

  const handleExportReport = () => {
    if (!report) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${report.name.toLowerCase().replace(/\s+/g, '_')}_summary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner />
        <span className="text-slate-400">Loading report details...</span>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Report Not Found"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Reports', href: '/dashboard/reports' },
            { label: 'Not Found' },
          ]}
        />
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-semibold text-white">Report Not Found</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            The report you are looking for does not exist or you do not have permission to view it.
          </p>
          <Link href="/dashboard/reports">
            <Button>&larr; Back to Reports</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Report Detail"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Reports', href: '/dashboard/reports' },
            { label: 'Error' },
          ]}
        />
        <Alert>{error || 'Failed to load report'}</Alert>
        <Link href="/dashboard/reports">
          <Button>&larr; Back to Reports</Button>
        </Link>
      </div>
    );
  }

  const totalFindings = report.findingsSummary.critical + report.findingsSummary.high + report.findingsSummary.medium + report.findingsSummary.low + report.findingsSummary.info;

  return (
    <div className="space-y-8">
      <PageHeader
        title={report.name}
        description={`Report ID: ${report.id}`}
        badge={<span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusBadgeClass(report.status)}`}>{report.status}</span>}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports', href: '/dashboard/reports' },
          { label: report.name },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {report.downloadUrl && (
              <a
                href={report.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors"
              >
                Download Report
              </a>
            )}
            <button
              onClick={handleExportReport}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm transition-colors"
            >
              Export JSON
            </button>
            <Link href="/dashboard/reports">
              <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm transition-colors">
                &larr; Back to Reports
              </button>
            </Link>
          </div>
        }
      />

      {/* Report Metadata */}
      <Card>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
            <p className="text-sm font-medium text-slate-200 mt-1">{report.status}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Project</p>
            <p className="text-sm font-medium text-slate-200 mt-1">{report.projectName || report.projectId}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Target</p>
            <p className="text-sm font-medium text-slate-200 mt-1">
              {report.targetName || 'Entire Project'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Generated</p>
            <p className="text-sm font-medium text-slate-200 mt-1">
              {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Findings Summary */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Findings Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/50">
              <p className="text-xs font-semibold uppercase text-red-400">Critical</p>
              <p className="text-2xl font-bold text-red-200 mt-1">{report.findingsSummary.critical}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-950/50 border border-orange-800/50">
              <p className="text-xs font-semibold uppercase text-orange-400">High</p>
              <p className="text-2xl font-bold text-orange-200 mt-1">{report.findingsSummary.high}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-800/50">
              <p className="text-xs font-semibold uppercase text-amber-400">Medium</p>
              <p className="text-2xl font-bold text-amber-200 mt-1">{report.findingsSummary.medium}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-950/50 border border-blue-800/50">
              <p className="text-xs font-semibold uppercase text-blue-400">Low</p>
              <p className="text-2xl font-bold text-blue-200 mt-1">{report.findingsSummary.low}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <p className="text-xs font-semibold uppercase text-slate-400">Info</p>
              <p className="text-2xl font-bold text-slate-300 mt-1">{report.findingsSummary.info}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800 text-center">
            <span className="text-sm font-medium text-slate-300">
              Total Findings: <strong className="text-white">{totalFindings}</strong>
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
