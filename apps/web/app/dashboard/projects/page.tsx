'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Card, Heading, Input, Spinner } from '@angelisyn/ui';
import { projectsService } from '@/services/projects.service';
import { createProjectSchema, updateProjectSchema, type CreateProjectFormValues, type UpdateProjectFormValues } from '@/lib/validator/projects';
import type { Project } from '@/types/projects';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const createForm = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', slug: '' },
  });

  const editForm = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(updateProjectSchema),
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);
        const data = await projectsService.getAll();
        if (isMounted) {
          setProjects(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load projects');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshProjects = async () => {
    try {
      const data = await projectsService.getAll();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload projects');
    }
  };

  const handleCreate = async (values: CreateProjectFormValues) => {
    try {
      setActionError(null);
      await projectsService.create(values);
      createForm.reset();
      setShowCreateForm(false);
      await refreshProjects();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const startEditing = (project: Project) => {
    setEditingProject(project);
    editForm.reset({ name: project.name, slug: project.slug });
  };

  const handleUpdate = async (values: UpdateProjectFormValues) => {
    if (!editingProject) return;
    try {
      setActionError(null);
      await projectsService.update(editingProject.id, values);
      setEditingProject(null);
      await refreshProjects();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}"?`)) return;
    try {
      setActionError(null);
      await projectsService.delete(id);
      await refreshProjects();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading>Projects</Heading>
          <p className="mt-1 text-sm text-slate-400">Organize security assessments by project scope.</p>
        </div>
        <Button onClick={() => { setShowCreateForm(!showCreateForm); setEditingProject(null); }}>
          {showCreateForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}

      {showCreateForm && (
        <Card>
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Create New Project</h2>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 max-w-md">
              <div>
                <label className="block mb-1 text-sm text-slate-300">Project Name</label>
                <Input {...createForm.register('name')} placeholder="My First Project" />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">Project Slug</label>
                <Input {...createForm.register('slug')} placeholder="my-first-project" />
                {createForm.formState.errors.slug && (
                  <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={createForm.handleSubmit(handleCreate)}>
                  {createForm.formState.isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {editingProject && (
        <Card>
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Edit Project: {editingProject.name}</h2>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4 max-w-md">
              <div>
                <label className="block mb-1 text-sm text-slate-300">Project Name</label>
                <Input {...editForm.register('name')} />
                {editForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">Project Slug</label>
                <Input {...editForm.register('slug')} />
                {editForm.formState.errors.slug && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={editForm.handleSubmit(handleUpdate)}>
                  {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400">
          <p className="text-lg font-medium text-slate-300">No projects yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first project to organize targets, scans, and security assessments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <div className="flex flex-col justify-between p-6 h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-lg">{project.name}</h3>
                    <Badge>Active</Badge>
                  </div>
                  <p className="mt-1 text-xs font-mono text-slate-400">/{project.slug}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>

                  {/* Security Assessment Quick Links */}
                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <Link href="/dashboard/targets" className="text-blue-400 hover:underline">Targets</Link>
                    <span className="text-slate-700">&bull;</span>
                    <Link href="/dashboard/scans" className="text-blue-400 hover:underline">Scans</Link>
                    <span className="text-slate-700">&bull;</span>
                    <Link href="/dashboard/findings" className="text-blue-400 hover:underline">Findings</Link>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => startEditing(project)}
                    className="rounded px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="rounded px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-slate-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
