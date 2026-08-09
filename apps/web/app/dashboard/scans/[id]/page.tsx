'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, Heading, Spinner } from '@angelisyn/ui';
import { scansService } from '@/services/scans.service';
import { findingsService } from '@/services/findings.service';
import type { Scan } from '@/types/scans';
import type { Finding } from '@/types/findings';

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RAW_OUTPUT' | 'FINDINGS'>('OVERVIEW');

  useEffect(() => {
    let isMounted = true;

    async function loadScanDetails() {
      try {
        setLoading(true);
        setError(null);
        const [scanData, findingsData] = await Promise.all([
          scansService.getById(id),
          findingsService.getByScan(id),
        ]);

        if (isMounted) {
          setScan(scanData);
          setFindings(findingsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load scan job details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadScanDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner />
        <span className="text-slate-400">Loading scan execution details...</span>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="space-y-4">
        <Alert>{error || 'Scan job not found'}</Alert>
        <Link href="/dashboard/scans">
          <Button>&larr; Back to Scans</Button>
        </Link>
      </div>
    );
  }

  const steps = ['QUEUED', 'RUNNING', scan.status === 'FAILED' ? 'FAILED' : 'COMPLETED'];
  const getStepIndex = (status: string) => {
    if (status === 'QUEUED') return 0;
    if (status === 'RUNNING') return 1;
    return 2;
  };
  const currentStepIdx = getStepIndex(scan.status);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Heading>{scan.name}</Heading>
            <Badge>{scan.executionMode}</Badge>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                scan.status === 'COMPLETED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : scan.status === 'RUNNING'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                  : scan.status === 'FAILED'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {scan.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Scan ID: <span className="font-mono text-slate-300">{scan.id}</span> &bull; Engine: <strong className="text-slate-200">{scan.scanner}</strong>
          </p>
        </div>

        <Link href="/dashboard/scans">
          <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm">
            &larr; Back to Scans
          </button>
        </Link>
      </div>

      {/* Visual Execution Lifecycle Stepper */}
      <Card>
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Scan Execution Lifecycle
          </p>
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {steps.map((stepName, idx) => {
              const isDone = idx < currentStepIdx || scan.status === 'COMPLETED';
              const isCurrent = idx === currentStepIdx && scan.status !== 'COMPLETED';
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
          Overview & Metadata
        </button>
        <button
          onClick={() => setActiveTab('FINDINGS')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'FINDINGS'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Detected Findings ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('RAW_OUTPUT')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'RAW_OUTPUT'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Raw Process Output
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'OVERVIEW' && (
        <Card>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Assessment Type</p>
              <p className="text-sm font-medium text-slate-200 mt-1">{scan.scanType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Execution Mode</p>
              <p className="text-sm font-medium text-emerald-400 mt-1">{scan.executionMode} (Local Node process)</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Target</p>
              <p className="text-sm font-mono text-blue-400 mt-1">{scan.targetValue || scan.targetId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Started Timestamp</p>
              <p className="text-sm font-medium text-slate-200 mt-1">
                {scan.startedAt ? new Date(scan.startedAt).toLocaleString() : 'Not started'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'FINDINGS' && (
        <div className="space-y-3">
          {findings.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-slate-400">
                No vulnerabilities or security findings reported for this scan.
              </div>
            </Card>
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
              Local Process Stdout / Stderr Stream
            </h3>
            {scan.rawOutput ? (
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                {scan.rawOutput}
              </pre>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm italic">
                Raw stdout log stream will populate when local executor finishes process run.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
