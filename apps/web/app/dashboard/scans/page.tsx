'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, Input, Spinner } from '@angelisyn/ui';
import { PageHeader } from '@/components/dashboard/page-header';
import { scansService } from '@/services/scans.service';
import { isApiError } from '@/lib/api';
import type { Scan, ScanStatus } from '@/types/scans';

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScanStatus | 'ALL'>('ALL');

  const fetchScans = useCallback(async () => {
    try {
      setError(null);
      const data = await scansService.getAll();
      setScans(data);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load scans');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const data = await scansService.getAll();
        if (isMounted) setScans(data);
      } catch (err) {
        if (isMounted) {
          setError(
            isApiError(err)
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Failed to load scans',
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.scanType.toLowerCase().includes(search.toLowerCase()) ||
      (s.targetValue && s.targetValue.toLowerCase().includes(search.toLowerCase())) ||
      (s.projectName && s.projectName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusBadgeClass = (status: ScanStatus) => {
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
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scans"
        description="Monitor and manage local security assessment jobs against your configured targets."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Scans' },
        ]}
        actions={
          <Link href="/dashboard/scans/new">
            <Button>+ New Scan</Button>
          </Link>
        }
      />

      {error && (
        <Alert>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => {
                setLoading(true);
                void fetchScans();
              }}
              className="ml-4 underline text-xs hover:text-white"
            >
              Retry
            </button>
          </div>
        </Alert>
      )}

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Input
            placeholder="Search scans by name, target, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ScanStatus | 'ALL')}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="QUEUED">QUEUED</option>
            <option value="RUNNING">RUNNING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading scans...</span>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">No scans found</p>
            <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
              {scans.length === 0
                ? 'Run your first security scan against a configured target to discover open ports, services, and vulnerabilities.'
                : 'No scans match your current filters. Try adjusting the search or status filter.'}
            </p>
          </div>
          {scans.length === 0 ? (
            <Link href="/dashboard/scans/new">
              <Button>Create First Scan</Button>
            </Link>
          ) : (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="text-xs text-blue-400 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan) => (
            <Card key={scan.id}>
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/scans/${scan.id}`}
                      className="text-base font-semibold text-white hover:text-blue-400 truncate"
                    >
                      {scan.name}
                    </Link>
                    <Badge>{scan.executionMode}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Type: <strong className="text-slate-300">{scan.scanType}</strong> &bull; Target:{' '}
                    <span className="font-mono text-blue-400">{scan.targetValue || scan.targetId}</span>
                    {scan.projectName && (
                      <>
                        {' '}&bull; Project: <span className="text-slate-300">{scan.projectName}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      Findings: <strong className="text-white">{scan.findingsCount}</strong>
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(scan.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${statusBadgeClass(scan.status)}`}
                  >
                    {scan.status}
                  </span>

                  <Link href={`/dashboard/scans/${scan.id}`}>
                    <button className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs transition-colors">
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
