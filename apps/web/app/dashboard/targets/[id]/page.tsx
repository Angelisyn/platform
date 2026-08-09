'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, Heading, Spinner } from '@angelisyn/ui';
import { targetsService } from '@/services/targets.service';
import { scansService } from '@/services/scans.service';
import { findingsService } from '@/services/findings.service';
import type { Target } from '@/types/targets';
import type { Scan } from '@/types/scans';
import type { Finding } from '@/types/findings';

export default function TargetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [target, setTarget] = useState<Target | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTargetDetail() {
      try {
        setLoading(true);
        setError(null);
        const [targetData, scansData, findingsData] = await Promise.all([
          targetsService.getById(id),
          scansService.getByTarget(id),
          findingsService.getByTarget(id),
        ]);

        if (isMounted) {
          setTarget(targetData);
          setScans(scansData);
          setFindings(findingsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load target details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadTargetDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner />
        <span className="text-slate-400">Loading target details...</span>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="space-y-4">
        <Alert>{error || 'Target not found'}</Alert>
        <Link href="/dashboard/targets">
          <Button>&larr; Back to Targets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Heading>{target.name}</Heading>
            <Badge>{target.type}</Badge>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              {target.status}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-blue-400">{target.target}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/targets">
            <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm">
              &larr; Back
            </button>
          </Link>
          <Link href={`/dashboard/scans/new?targetId=${target.id}`}>
            <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm">
              + Run Local Scan
            </button>
          </Link>
        </div>
      </div>

      {/* Target Metadata Card */}
      <Card>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Target Type</p>
            <p className="text-sm font-medium text-slate-200 mt-1">{target.type}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Project ID</p>
            <p className="text-sm font-medium text-slate-200 mt-1">{target.projectId}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Created Date</p>
            <p className="text-sm font-medium text-slate-200 mt-1">
              {new Date(target.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Related Scans */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Scans on this Target ({scans.length})</h2>
        {scans.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-slate-400 space-y-3">
              <p className="text-sm">No scans run on this target yet.</p>
              <Link href={`/dashboard/scans/new?targetId=${target.id}`}>
                <Button>Start First Scan</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <Card key={scan.id}>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <Link href={`/dashboard/scans/${scan.id}`} className="font-medium text-white hover:text-blue-400">
                      {scan.name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">Type: {scan.scanType} &bull; Mode: {scan.executionMode}</p>
                  </div>
                  <Badge>{scan.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Related Findings */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Findings on this Target ({findings.length})</h2>
        {findings.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-slate-400">
              No vulnerabilities detected on this target.
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {findings.map((finding) => (
              <Card key={finding.id}>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <Link href={`/dashboard/findings/${finding.id}`} className="font-medium text-white hover:text-blue-400">
                      {finding.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">{finding.description}</p>
                  </div>
                  <Badge>{finding.severity}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
