'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Card, Heading, Input, Spinner } from '@angelisyn/ui';
import { scansService } from '@/services/scans.service';
import type { Scan, ScanStatus } from '@/types/scans';

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScanStatus | 'ALL'>('ALL');

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const data = await scansService.getAll();
        if (isMounted) {
          setScans(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load scans');
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.scanType.toLowerCase().includes(search.toLowerCase()) ||
      (s.targetValue && s.targetValue.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Heading>Security Scans Monitor</Heading>
          <p className="mt-1 text-sm text-slate-400">
            Monitor and execute local security assessment jobs.
          </p>
        </div>
        <Link href="/dashboard/scans/new">
          <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm">
            + New Local Scan
          </button>
        </Link>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search scans by name or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium uppercase">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ScanStatus | 'ALL')}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="QUEUED">QUEUED</option>
            <option value="RUNNING">RUNNING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading scan jobs...</span>
        </div>
      ) : filteredScans.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-slate-400 space-y-4">
            <p className="text-lg font-medium text-slate-200">No scans found</p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Initiate a local security scan on your configured targets to discover open ports, services, and vulnerabilities.
            </p>
            <Link href="/dashboard/scans/new">
              <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm">
                Create First Local Scan
              </button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan) => (
            <Card key={scan.id}>
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/scans/${scan.id}`}
                      className="text-base font-semibold text-white hover:text-blue-400"
                    >
                      {scan.name}
                    </Link>
                    <Badge>{scan.executionMode}</Badge>
                    <span className="text-xs text-slate-500 font-mono">
                      Engine: {scan.scanner}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Type: <strong className="text-slate-300">{scan.scanType}</strong> &bull; Target:{' '}
                    <span className="font-mono text-blue-400">{scan.targetValue || scan.targetId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Findings: <strong className="text-white">{scan.findingsCount}</strong></p>
                    <p className="text-xs text-slate-500">{new Date(scan.createdAt).toLocaleTimeString()}</p>
                  </div>

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

                  <Link href={`/dashboard/scans/${scan.id}`}>
                    <button className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs">
                      View &rarr;
                    </button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
