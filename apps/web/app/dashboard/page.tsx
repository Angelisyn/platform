'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, Heading, Spinner } from '@angelisyn/ui';
import { useAuth } from '@/hooks/use-auth';
import { projectsService } from '@/services/projects.service';
import { targetsService } from '@/services/targets.service';
import { scansService } from '@/services/scans.service';
import { findingsService } from '@/services/findings.service';
import type { Target } from '@/types/targets';
import type { Scan } from '@/types/scans';
import type { Finding } from '@/types/findings';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [projectsCount, setProjectsCount] = useState(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSecurityOverview() {
      try {
        setLoading(true);
        setError(null);
        const [projectsData, targetsData, scansData, findingsData] = await Promise.all([
          projectsService.getAll(),
          targetsService.getAll(),
          scansService.getAll(),
          findingsService.getAll(),
        ]);

        if (isMounted) {
          setProjectsCount(projectsData.length);
          setTargets(targetsData);
          setScans(scansData);
          setFindings(findingsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load security overview data',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadSecurityOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const runningScansCount = scans.filter((s) => s.status === 'RUNNING' || s.status === 'QUEUED').length;
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL').length;
  const highFindings = findings.filter((f) => f.severity === 'HIGH').length;
  const mediumFindings = findings.filter((f) => f.severity === 'MEDIUM').length;
  const lowFindings = findings.filter((f) => f.severity === 'LOW').length;
  const infoFindings = findings.filter((f) => f.severity === 'INFO').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heading>Security Overview</Heading>
            <Badge>Local Execution Mode</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back, <span className="font-semibold text-slate-200">{user?.name ?? 'Security Analyst'}</span> ({user?.email})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/targets">
            <Button>+ Add Target</Button>
          </Link>
          <Link href="/dashboard/scans/new">
            <button className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base transition-colors">
              + New Scan
            </button>
          </Link>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading security assessment metrics...</span>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-slate-400">Total Projects</p>
                <p className="mt-2 text-3xl font-bold text-white">{projectsCount}</p>
                <Link href="/dashboard/projects" className="mt-2 inline-block text-xs text-blue-400 hover:underline">
                  Manage Projects &rarr;
                </Link>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-slate-400">Active Targets</p>
                <p className="mt-2 text-3xl font-bold text-white">{targets.length}</p>
                <Link href="/dashboard/targets" className="mt-2 inline-block text-xs text-blue-400 hover:underline">
                  View Targets &rarr;
                </Link>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-slate-400">Running / Queued Scans</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-400">{runningScansCount}</span>
                  <span className="text-xs text-slate-500">/ {scans.length} total</span>
                </div>
                <Link href="/dashboard/scans" className="mt-2 inline-block text-xs text-blue-400 hover:underline">
                  Scan Monitor &rarr;
                </Link>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-slate-400">Total Findings</p>
                <p className="mt-2 text-3xl font-bold text-white">{findings.length}</p>
                <Link href="/dashboard/findings" className="mt-2 inline-block text-xs text-blue-400 hover:underline">
                  Review Vulnerabilities &rarr;
                </Link>
              </div>
            </Card>
          </div>

          {/* Severity Breakdown Bar */}
          <Card>
            <div className="p-6">
              <h2 className="text-base font-semibold text-slate-200 mb-4">Findings Severity Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/50">
                  <p className="text-xs font-semibold uppercase text-red-400">Critical</p>
                  <p className="text-2xl font-bold text-red-200 mt-1">{criticalFindings}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-950/50 border border-orange-800/50">
                  <p className="text-xs font-semibold uppercase text-orange-400">High</p>
                  <p className="text-2xl font-bold text-orange-200 mt-1">{highFindings}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-800/50">
                  <p className="text-xs font-semibold uppercase text-amber-400">Medium</p>
                  <p className="text-2xl font-bold text-amber-200 mt-1">{mediumFindings}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-950/50 border border-blue-800/50">
                  <p className="text-xs font-semibold uppercase text-blue-400">Low</p>
                  <p className="text-2xl font-bold text-blue-200 mt-1">{lowFindings}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-xs font-semibold uppercase text-slate-400">Info</p>
                  <p className="text-2xl font-bold text-slate-300 mt-1">{infoFindings}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Scans & Findings Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Recent Scans */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">Recent Local Scans</h2>
                <Link href="/dashboard/scans" className="text-xs text-blue-400 hover:underline">
                  View All Scans
                </Link>
              </div>

              {scans.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400 space-y-3">
                  <p className="text-sm">No local scans executed yet.</p>
                  <Link href="/dashboard/scans/new" className="inline-block">
                    <Button>Create First Local Scan</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {scans.slice(0, 5).map((scan) => (
                    <Card key={scan.id}>
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/scans/${scan.id}`} className="font-medium text-white hover:text-blue-400">
                              {scan.name}
                            </Link>
                            <Badge>{scan.executionMode}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Target: {scan.targetValue || scan.targetId} &bull; Type: {scan.scanType}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            scan.status === 'COMPLETED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : scan.status === 'RUNNING'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse'
                              : scan.status === 'FAILED'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {scan.status}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Security Findings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">Recent Findings</h2>
                <Link href="/dashboard/findings" className="text-xs text-blue-400 hover:underline">
                  View All Findings
                </Link>
              </div>

              {findings.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
                  No vulnerabilities or findings reported.
                </div>
              ) : (
                <div className="space-y-3">
                  {findings.slice(0, 5).map((finding) => (
                    <Card key={finding.id}>
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <Link href={`/dashboard/findings/${finding.id}`} className="font-medium text-white hover:text-blue-400">
                            {finding.title}
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Target: {finding.targetName || finding.targetId}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            finding.severity === 'CRITICAL'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : finding.severity === 'HIGH'
                              ? 'bg-orange-950 text-orange-300 border border-orange-800'
                              : finding.severity === 'MEDIUM'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}