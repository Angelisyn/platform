'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Card, Heading, Input, Spinner } from '@angelisyn/ui';
import { targetsService } from '@/services/targets.service';
import { projectsService } from '@/services/projects.service';
import { createTargetSchema, type CreateTargetInput } from '@/lib/validator/targets';
import type { Target } from '@/types/targets';
import type { Project } from '@/types/projects';

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTargetInput>({
    resolver: zodResolver(createTargetSchema),
    defaultValues: {
      name: '',
      target: '',
      type: 'IP_ADDRESS',
      projectId: '',
    },
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [targetsData, projectsData] = await Promise.all([
        targetsService.getAll(),
        projectsService.getAll(),
      ]);
      setTargets(targetsData);
      setProjects(projectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load targets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [targetsData, projectsData] = await Promise.all([
          targetsService.getAll(),
          projectsService.getAll(),
        ]);
        if (isMounted) {
          setTargets(targetsData);
          setProjects(projectsData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load targets');
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (data: CreateTargetInput) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await targetsService.create(data);
      setModalOpen(false);
      reset();
      await loadData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create target');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this target?')) return;
    try {
      await targetsService.delete(id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete target');
    }
  };

  const filteredTargets = targets.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.target.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Heading>Target Management</Heading>
          <p className="mt-1 text-sm text-slate-400">
            Define target IP addresses, hostnames, and domains for local security scanning.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Add Target</Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Search & Toolbar */}
      <div className="flex items-center gap-4">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search targets by name, IP, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading targets...</span>
        </div>
      ) : filteredTargets.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-slate-400 space-y-4">
            <p className="text-lg font-medium text-slate-200">No targets found</p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Add your first target system (IP address, hostname, or domain) to initiate security assessments.
            </p>
            <Button onClick={() => setModalOpen(true)}>+ Add Target</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTargets.map((target) => (
            <Card key={target.id}>
              <div className="p-6 space-y-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-white truncate">{target.name}</h3>
                    <Badge>{target.type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="font-mono text-sm text-blue-400 mt-1 truncate">{target.target}</p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Status: <strong className="text-emerald-400 font-medium">{target.status}</strong></span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/targets/${target.id}`}
                      className="text-blue-400 hover:underline font-medium"
                    >
                      Details &rarr;
                    </Link>
                    <button
                      onClick={() => handleDelete(target.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Target Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-white">Create Scan Target</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {submitError && <Alert>{submitError}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target Name
                </label>
                <Input placeholder="e.g. Primary Web Server" {...register('name')} />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target Type
                </label>
                <select
                  {...register('type')}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="IP_ADDRESS">IP Address (e.g. 192.168.1.100)</option>
                  <option value="HOSTNAME">Hostname (e.g. app-server.local)</option>
                  <option value="DOMAIN">Domain (e.g. target-domain.org)</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-xs text-red-400">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target Value (IP / Domain / Hostname)
                </label>
                <Input placeholder="192.168.1.1" {...register('target')} />
                {errors.target && (
                  <p className="mt-1 text-xs text-red-400">{errors.target.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Project
                </label>
                <select
                  {...register('projectId')}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="mt-1 text-xs text-red-400">{errors.projectId.message}</p>
                )}
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
                  {submitting ? 'Creating...' : 'Create Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
