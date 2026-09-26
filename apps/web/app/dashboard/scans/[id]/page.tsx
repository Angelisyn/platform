'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, Spinner } from '@angelisyn/ui';
import { PageHeader } from '@/components/dashboard/page-header';
import { scansService } from '@/services/scans.service';
import { findingsService } from '@/services/findings.service';
import { isApiError } from '@/lib/api';
import type { Scan, ScanStatus } from '@/types/scans';
import type { Finding } from '@/types/findings';

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATUSES: ReadonlySet<ScanStatus> = new Set(['COMPLETED', 'FAILED']);

function statusBadgeClass(status: ScanStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
    case 'RUNNING':
      return 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse';
    case 'FAILED':
      return 'bg-red-950 text-red-300 border border-red-800';
    case 'QUEUED':
    default:
      return 'bg-slate-800 text-slate-400';
  }
}

function statusLabel(status: ScanStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'COMPLETED';
    case 'RUNNING':
      return 'RUNNING';
    case 'FAILED':
      return 'FAILED';
    case 'QUEUED':
      return 'QUEUED';
    default:
      return status;
  }
}

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RAW_OUTPUT' | 'FINDINGS'>('OVERVIEW');
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  // Monotonic generation for state-writing requests: any newer request,
  // cancellation, stop, or unmount invalidates older in-flight responses.
  const requestSeqRef = useRef(0);

  const beginRequest = useCallback(() => {
    requestSeqRef.current += 1;
    return requestSeqRef.current;
  }, []);

  const isCurrentRequest = useCallback(
    (seq: number) => isMountedRef.current && seq === requestSeqRef.current,
    [],
  );

  const stopPolling = useCallback(() => {
    // Invalidate any in-flight poll response so it cannot overwrite newer state.
    requestSeqRef.current += 1;
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (scanId: string) => {
      stopPolling();
      pollTimerRef.current = setInterval(async () => {
        if (!isMountedRef.current) {
          stopPolling();
          return;
        }
        const seq = beginRequest();
        try {
          const updated = await scansService.getById(scanId);
          if (!isCurrentRequest(seq)) return;
          setScan(updated);
          if (TERMINAL_STATUSES.has(updated.status)) {
            stopPolling();
            // Fetch findings on terminal state
            const findingsSeq = beginRequest();
            try {
              const updatedFindings = await findingsService.getByScan(scanId);
              if (isCurrentRequest(findingsSeq)) {
                setFindings(updatedFindings);
              }
            } catch {
              // Findings refresh failure after terminal state — keep existing list
            }
          }
        } catch {
          // Network error during polling — stop to avoid spamming
          stopPolling();
        }
      }, POLL_INTERVAL_MS);
    },
    [beginRequest, isCurrentRequest, stopPolling],
  );

  const loadScanDetails = useCallback(async () => {
    const seq = beginRequest();
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);
      const [scanData, findingsData] = await Promise.all([
        scansService.getById(id),
        findingsService.getByScan(id),
      ]);

      if (!isCurrentRequest(seq)) return;

      setScan(scanData);
      setFindings(findingsData);
      setLoading(false);

      // NOTE: startPolling() bumps the request generation (via stopPolling),
      // so the loading state must be resolved before it is called.
      if (!TERMINAL_STATUSES.has(scanData.status)) {
        startPolling(id);
      }
    } catch (err) {
      if (isCurrentRequest(seq)) {
        if (isApiError(err) && err.isNotFound) {
          setNotFound(true);
        } else if (isApiError(err)) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load scan details');
        }
        setLoading(false);
      }
    }
  }, [beginRequest, id, isCurrentRequest, startPolling]);

  useEffect(() => {
    isMountedRef.current = true;

    void loadScanDetails();

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [loadScanDetails, stopPolling]);

  const handleCancel = async () => {
    if (!scan) return;
    try {
      setCancelling(true);
      setCancelError(null);
      await scansService.cancel(scan.id);
      // Stop polling first: this invalidates any in-flight poll response.
      stopPolling();
      // Immediately refresh scan data (newest request wins)
      const seq = beginRequest();
      const updated = await scansService.getById(scan.id);
      if (isCurrentRequest(seq)) {
        setScan(updated);
        const findingsSeq = beginRequest();
        const updatedFindings = await findingsService.getByScan(scan.id);
        if (isCurrentRequest(findingsSeq)) {
          setFindings(updatedFindings);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        if (isApiError(err)) {
          setCancelError(err.message);
        } else {
          setCancelError(err instanceof Error ? err.message : 'Failed to cancel scan');
        }
      }
    } finally {
      if (isMountedRef.current) setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner />
        <span className="text-slate-400">Loading scan details...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Scan Not Found"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Scans', href: '/dashboard/scans' },
            { label: 'Not Found' },
          ]}
        />
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-semibold text-white">Scan Not Found</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            The scan you are looking for does not exist or you do not have permission to access it.
          </p>
          <Link href="/dashboard/scans">
            <Button>&larr; Back to Scans</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Scan Detail"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Scans', href: '/dashboard/scans' },
            { label: 'Detail' },
          ]}
        />
        <Alert>
          <div className="flex items-center justify-between">
            <span>{error || 'Failed to load scan details'}</span>
            <button
              onClick={() => {
                setLoading(true);
                void loadScanDetails();
              }}
              className="ml-4 underline text-xs hover:text-white"
            >
              Retry
            </button>
          </div>
        </Alert>
        <Link href="/dashboard/scans">
          <Button>&larr; Back to Scans</Button>
        </Link>
      </div>
    );
  }

  const isRunning = scan.status === 'RUNNING' || scan.status === 'QUEUED';
  const canCancel = scan.status === 'QUEUED' || scan.status === 'RUNNING';

  // Build the execution lifecycle stepper steps
  const steps = ['QUEUED', 'RUNNING', scan.status === 'FAILED' ? 'FAILED' : 'COMPLETED'];
  const getStepIndex = (status: ScanStatus) => {
    if (status === 'QUEUED') return 0;
    if (status === 'RUNNING') return 1;
    return 2;
  };
  const currentStepIdx = getStepIndex(scan.status);

  return (
    <div className="space-y-8">
      <PageHeader
        title={scan.name}
        description={`Scan ID: ${scan.id} \u2022 Engine: ${scan.scanner}`}
        badge={<Badge>{scan.executionMode}</Badge>}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Scans', href: '/dashboard/scans' },
          { label: scan.name },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {canCancel && (
              <button
                onClick={() => void handleCancel()}
                disabled={cancelling}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Scan'}
              </button>
            )}
            <Link href="/dashboard/scans">
              <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm transition-colors">
                &larr; Back to Scans
              </button>
            </Link>
          </div>
        }
      >
        {/* Status badge inline with header */}
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusBadgeClass(scan.status)}`}>
            {statusLabel(scan.status)}
          </span>
          {isRunning && (
            <span className="text-xs text-blue-400 animate-pulse">
              Polling for updates...
            </span>
          )}
        </div>
      </PageHeader>

      {cancelError && <Alert>{cancelError}</Alert>}

      {/* Visual Execution Lifecycle Stepper */}
      <Card>
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Scan Execution Lifecycle
          </p>
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {steps.map((stepName, idx) => {
              const isDone = idx < currentStepIdx || scan.status === 'COMPLETED';
              const isCurrent = idx === currentStepIdx && !TERMINAL_STATUSES.has(scan.status);
              const isFailed = stepName === 'FAILED' && scan.status === 'FAILED';

              return (
                <div key={stepName} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isFailed
                          ? 'bg-red-600 text-white'
                          : isDone
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-900/50 animate-pulse'
                              : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-xs font-medium text-slate-400">{stepName}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        idx < currentStepIdx ? 'bg-emerald-600' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('FINDINGS')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'FINDINGS'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Findings ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('RAW_OUTPUT')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'RAW_OUTPUT'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Raw Output
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'OVERVIEW' && (
        <Card>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Scan Type</p>
              <p className="text-sm font-medium text-slate-200 mt-1">{scan.scanType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Execution Mode</p>
              <p className="text-sm font-medium text-emerald-400 mt-1">{scan.executionMode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Target</p>
              <p className="text-sm font-mono text-blue-400 mt-1 truncate" title={scan.targetValue || scan.targetId}>
                {scan.targetName && <span className="font-sans text-slate-200">{scan.targetName} — </span>}
                {scan.targetValue || scan.targetId}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Project</p>
              <p className="text-sm font-medium text-slate-200 mt-1">{scan.projectName || scan.projectId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Findings</p>
              <p className="text-sm font-medium text-slate-200 mt-1">{scan.findingsCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Created</p>
              <p className="text-sm font-medium text-slate-200 mt-1">
                {new Date(scan.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Started At</p>
              <p className="text-sm font-medium text-slate-200 mt-1">
                {scan.startedAt ? new Date(scan.startedAt).toLocaleString() : 'Not started'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Completed At</p>
              <p className="text-sm font-medium text-slate-200 mt-1">
                {scan.completedAt ? new Date(scan.completedAt).toLocaleString() : 'In progress...'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Duration</p>
              <p className="text-sm font-medium text-slate-200 mt-1">
                {scan.startedAt && scan.completedAt
                  ? `${Math.round((new Date(scan.completedAt).getTime() - new Date(scan.startedAt).getTime()) / 1000)}s`
                  : scan.startedAt
                    ? 'In progress...'
                    : '—'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'FINDINGS' && (
        <div className="space-y-3">
          {findings.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
              <p className="text-sm">
                {scan.status === 'FAILED'
                  ? 'This scan failed before completion, so no findings were generated.'
                  : scan.status === 'COMPLETED'
                    ? 'No findings reported for this scan.'
                    : 'Findings will appear here after scan completion.'}
              </p>
            </div>
          ) : (
            findings.map((f) => (
              <Card key={f.id}>
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <Link href={`/dashboard/findings/${f.id}`} className="font-semibold text-white hover:text-blue-400">
                      {f.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-1">{f.description}</p>
                  </div>
                  <Badge>{f.severity}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'RAW_OUTPUT' && (
        <Card>
          <div className="p-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider">
              Raw Process Output
            </h3>
            {scan.rawOutput ? (
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                {scan.rawOutput}
              </pre>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm italic">
                {scan.status === 'RUNNING' || scan.status === 'QUEUED'
                  ? 'Output will appear when the scan completes...'
                  : 'No raw output available for this scan.'}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error Details (shown when scan failed) */}
      {scan.status === 'FAILED' && scan.errorDetails && (
        <Card>
          <div className="p-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase text-red-400 tracking-wider">
              Error Details
            </h3>
            <pre className="p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-xs font-mono text-red-300 overflow-x-auto whitespace-pre-wrap">
              {scan.errorDetails}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
