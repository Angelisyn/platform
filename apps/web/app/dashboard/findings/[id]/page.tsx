'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, Heading, Spinner } from '@angelisyn/ui';
import { findingsService } from '@/services/findings.service';
import type { Finding } from '@/types/findings';

export default function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFindingDetail() {
      try {
        setLoading(true);
        setError(null);
        const data = await findingsService.getById(id);
        if (isMounted) {
          setFinding(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load finding details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadFindingDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner />
        <span className="text-slate-400">Loading finding details...</span>
      </div>
    );
  }

  if (error || !finding) {
    return (
      <div className="space-y-4">
        <Alert>{error || 'Finding not found'}</Alert>
        <Link href="/dashboard/findings">
          <Button>&larr; Back to Findings</Button>
        </Link>
      </div>
    );
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border border-red-800';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border border-orange-800';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border border-amber-800';
      default:
        return 'bg-blue-950 text-blue-300 border border-blue-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Heading>{finding.title}</Heading>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${getSeverityBadgeClass(
                finding.severity,
              )}`}
            >
              {finding.severity}
            </span>
            {finding.cve && <Badge>{finding.cve}</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Detected: {new Date(finding.detectedAt).toLocaleString()} &bull; Status: <strong className="text-emerald-400">{finding.status}</strong>
          </p>
        </div>

        <Link href="/dashboard/findings">
          <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm">
            &larr; Back to Findings
          </button>
        </Link>
      </div>

      {/* Target & Scan Links Bar */}
      <Card>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Target System</p>
            <Link href={`/dashboard/targets/${finding.targetId}`} className="text-sm font-medium text-blue-400 hover:underline mt-1 block">
              {finding.targetName || finding.targetId} &rarr;
            </Link>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Origin Scan Job</p>
            <Link href={`/dashboard/scans/${finding.scanId}`} className="text-sm font-medium text-blue-400 hover:underline mt-1 block">
              {finding.scanName || finding.scanId} &rarr;
            </Link>
          </div>
        </div>
      </Card>

      {/* Description */}
      <Card>
        <div className="p-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Vulnerability Description</h2>
          <p className="text-sm text-slate-200 leading-relaxed">{finding.description}</p>
        </div>
      </Card>

      {/* Technical Evidence Code Section */}
      <Card>
        <div className="p-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Technical Evidence & Log Output</h2>
          {finding.evidence ? (
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
              {finding.evidence}
            </pre>
          ) : (
            <div className="p-6 text-center text-slate-500 text-sm italic">
              No evidence payload attached to this finding.
            </div>
          )}
        </div>
      </Card>

      {/* Impact & Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-orange-400">Potential Impact</h2>
            <p className="text-sm text-slate-300">
              {finding.impact || 'Uncontrolled access or service disruption may result if exploited.'}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Remediation Recommendation</h2>
            <p className="text-sm text-slate-300">
              {finding.recommendation || 'Apply the latest security patches and restrict public port exposure.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
