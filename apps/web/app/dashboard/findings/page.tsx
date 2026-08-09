'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Card, Heading, Input, Spinner } from '@angelisyn/ui';
import { findingsService } from '@/services/findings.service';
import type { Finding, FindingSeverity } from '@/types/findings';

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | 'ALL'>('ALL');

  useEffect(() => {
    async function loadFindings() {
      try {
        setLoading(true);
        setError(null);
        const data = await findingsService.getAll();
        setFindings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load findings');
      } finally {
        setLoading(false);
      }
    }

    void loadFindings();
  }, []);

  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      (f.targetName && f.targetName.toLowerCase().includes(search.toLowerCase()));

    const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadgeClass = (severity: FindingSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border border-red-800';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border border-orange-800';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border border-amber-800';
      case 'LOW':
        return 'bg-blue-950 text-blue-300 border border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Heading>Vulnerability & Security Findings</Heading>
        <p className="mt-1 text-sm text-slate-400">
          Aggregated security issues identified across local execution scan jobs.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search findings by title or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium uppercase">Severity Filter:</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as FindingSeverity | 'ALL')}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFO">INFO</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading vulnerabilities...</span>
        </div>
      ) : filteredFindings.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p className="text-lg font-medium text-slate-200">No findings detected</p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Run security assessments on your targets to discover open ports, misconfigurations, and known CVE vulnerabilities.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <Card key={finding.id}>
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/findings/${finding.id}`}
                      className="text-base font-semibold text-white hover:text-blue-400"
                    >
                      {finding.title}
                    </Link>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getSeverityBadgeClass(
                        finding.severity,
                      )}`}
                    >
                      {finding.severity}
                    </span>
                    {finding.cve && (
                      <Badge>{finding.cve}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Target: <strong className="text-slate-300">{finding.targetName || finding.targetId}</strong> &bull; Scan:{' '}
                    <span className="text-slate-400">{finding.scanName || finding.scanId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 font-mono">
                    Status: <strong className="text-emerald-400">{finding.status}</strong>
                  </span>
                  <Link href={`/dashboard/findings/${finding.id}`}>
                    <span className="text-xs text-blue-400 hover:underline font-medium">
                      Details &rarr;
                    </span>
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
