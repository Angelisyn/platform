'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Card, Heading, Spinner } from '@angelisyn/ui';
import { useAuth } from '@/hooks/use-auth';
import { projectsService } from '@/services/projects.service';
import { agentsService } from '@/services/agents.service';
import type { Project } from '@/types/projects';
import type { Agent } from '@/types/agents';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const [projectsData, agentsData] = await Promise.all([
          projectsService.getAll(),
          agentsService.getAll(),
        ]);

        if (isMounted) {
          setProjects(projectsData);
          setAgents(agentsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load dashboard data',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <Heading>Dashboard Overview</Heading>
        <p className="mt-1 text-sm text-slate-400">
          Welcome back, <span className="font-semibold text-slate-200">{user?.name ?? 'User'}</span> ({user?.email})
        </p>
      </div>

      {error && (
        <Alert>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading overview data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-slate-400">Total Projects</p>
                <p className="mt-2 text-3xl font-bold text-white">{projects.length}</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-slate-400">Total Agents</p>
                <p className="mt-2 text-3xl font-bold text-white">{agents.length}</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <p className="text-sm font-medium text-slate-400">Account Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge>Active</Badge>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">Recent Projects</h2>
                <Link href="/dashboard/projects" className="text-xs text-blue-400 hover:underline">
                  View All
                </Link>
              </div>

              {projects.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
                  No projects created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <Card key={project.id}>
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium text-white">{project.name}</p>
                          <p className="text-xs text-slate-400">/{project.slug}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">Recent Agents</h2>
                <Link href="/dashboard/agents" className="text-xs text-blue-400 hover:underline">
                  View All
                </Link>
              </div>

              {agents.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
                  No AI agents configured yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {agents.slice(0, 5).map((agent) => (
                    <Card key={agent.id}>
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{agent.name}</p>
                            <Badge>{agent.provider}</Badge>
                          </div>
                          <p className="text-xs text-slate-400">Model: {agent.model}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(agent.createdAt).toLocaleDateString()}
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