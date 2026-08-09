'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Card, Heading, Input, Spinner } from '@angelisyn/ui';
import { getModelsForProvider, getSupportedProviders } from '@angelisyn/types';
import { agentsService } from '@/services/agents.service';
import { projectsService } from '@/services/projects.service';
import { createAgentSchema, updateAgentSchema, type CreateAgentFormValues, type UpdateAgentFormValues } from '@/lib/validator/agents';
import type { Agent, AgentExecutionResponse } from '@/types/agents';
import type { Project } from '@/types/projects';

const SECRET_PATTERN = /(sk-[a-zA-Z0-9_\-]{15,}|bearer\s+eyJ|ghp_[a-zA-Z0-9]{30,}|xoxb-[0-9a-zA-Z-]+)/i;

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null);
  const [prompt, setPrompt] = useState('');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<AgentExecutionResponse | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const createForm = useForm<CreateAgentFormValues>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: { name: '', provider: '', model: '', projectId: '' },
  });

  const editForm = useForm<UpdateAgentFormValues>({
    resolver: zodResolver(updateAgentSchema),
  });

  const selectedCreateProvider = useWatch({ control: createForm.control, name: 'provider' }) ?? '';
  const createModels = getModelsForProvider(selectedCreateProvider);

  const selectedEditProvider = useWatch({ control: editForm.control, name: 'provider' }) ?? '';
  const editModels = getModelsForProvider(selectedEditProvider);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [agentsData, projectsData] = await Promise.all([
          agentsService.getAll(),
          projectsService.getAll(),
        ]);
        if (isMounted) {
          setAgents(agentsData);
          setProjects(projectsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshAgents = async () => {
    try {
      const data = await agentsService.getAll();
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload agents');
    }
  };

  const handleCreate = async (values: CreateAgentFormValues) => {
    try {
      setActionError(null);
      await agentsService.create(values);
      createForm.reset();
      setShowCreateForm(false);
      await refreshAgents();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create agent');
    }
  };

  const startEditing = (agent: Agent) => {
    setEditingAgent(agent);
    setTestingAgent(null);
    setShowCreateForm(false);
    editForm.reset({ name: agent.name, provider: agent.provider, model: agent.model, projectId: agent.projectId });
  };

  const startTesting = (agent: Agent) => {
    setTestingAgent(agent);
    setPrompt('');
    setExecutionResult(null);
    setExecutionError(null);
    setShowCreateForm(false);
    setEditingAgent(null);
  };

  const handleExecute = async () => {
    if (!testingAgent || executing) return;
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setExecutionError('Prompt is required');
      return;
    }
    if (SECRET_PATTERN.test(trimmedPrompt)) {
      setExecutionError('Prompt appears to contain an API key or secret token. Please remove all secrets before running.');
      return;
    }
    try {
      setExecuting(true);
      setExecutionError(null);
      setExecutionResult(null);
      const res = await agentsService.execute(testingAgent.id, { prompt: trimmedPrompt });
      setExecutionResult(res);
    } catch (err) {
      setExecutionError(err instanceof Error ? err.message : 'Failed to execute agent');
    } finally {
      setExecuting(false);
    }
  };

  const handleUpdate = async (values: UpdateAgentFormValues) => {
    if (!editingAgent) return;
    try {
      setActionError(null);
      await agentsService.update(editingAgent.id, values);
      setEditingAgent(null);
      await refreshAgents();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update agent');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete agent "${name}"?`)) return;
    try {
      setActionError(null);
      await agentsService.delete(id);
      await refreshAgents();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  const projectNameById = (projectId: string) => {
    const p = projects.find((proj) => proj.id === projectId);
    return p ? p.name : projectId;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading>Agents</Heading>
          <p className="mt-1 text-sm text-slate-400">Manage your AI agents.</p>
        </div>
        <Button onClick={() => { setShowCreateForm(!showCreateForm); setEditingAgent(null); setTestingAgent(null); }}>
          {showCreateForm ? 'Cancel' : 'New Agent'}
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}

      {showCreateForm && (
        <Card>
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Create New Agent</h2>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-400">You need to create a project before adding an agent.</p>
            ) : (
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 max-w-md">
                <div>
                  <label className="block mb-1 text-sm text-slate-300">Agent Name</label>
                  <Input {...createForm.register('name')} placeholder="My Agent" />
                  {createForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-sm text-slate-300">Provider</label>
                  <select
                    {...createForm.register('provider')}
                    onChange={(e) => {
                      createForm.setValue('provider', e.target.value, { shouldValidate: true });
                      createForm.setValue('model', '', { shouldValidate: true });
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a provider</option>
                    {getSupportedProviders().map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {createForm.formState.errors.provider && (
                    <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.provider.message}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-sm text-slate-300">Model</label>
                  <select
                    {...createForm.register('model')}
                    disabled={!selectedCreateProvider}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select a model</option>
                    {createModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                  {createForm.formState.errors.model && (
                    <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.model.message}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-sm text-slate-300">Project</label>
                  <select {...createForm.register('projectId')} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Select a project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {createForm.formState.errors.projectId && (
                    <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.projectId.message}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={createForm.handleSubmit(handleCreate)}>
                    {createForm.formState.isSubmitting ? 'Creating...' : 'Create Agent'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      )}

      {editingAgent && (
        <Card>
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Edit Agent: {editingAgent.name}</h2>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4 max-w-md">
              <div>
                <label className="block mb-1 text-sm text-slate-300">Agent Name</label>
                <Input {...editForm.register('name')} />
                {editForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">Provider</label>
                <select
                  {...editForm.register('provider')}
                  onChange={(e) => {
                    editForm.setValue('provider', e.target.value, { shouldValidate: true });
                    editForm.setValue('model', '', { shouldValidate: true });
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a provider</option>
                  {getSupportedProviders().map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {editForm.formState.errors.provider && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.provider.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">Model</label>
                <select
                  {...editForm.register('model')}
                  disabled={!selectedEditProvider}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select a model</option>
                  {editModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
                {editForm.formState.errors.model && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.model.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">Project</label>
                <select {...editForm.register('projectId')} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {editForm.formState.errors.projectId && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.projectId.message}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={editForm.handleSubmit(handleUpdate)}>
                  {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <button type="button" onClick={() => setEditingAgent(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {testingAgent && (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Test Agent: {testingAgent.name}</h2>
                <p className="text-xs text-slate-400">
                  Provider: <span className="text-slate-200 font-mono">{testingAgent.provider}</span> | Model: <span className="text-slate-200 font-mono">{testingAgent.model}</span>
                </p>
              </div>
              <button type="button" onClick={() => setTestingAgent(null)} className="text-slate-400 hover:text-white text-sm">
                Close
              </button>
            </div>

            {executionError && <Alert>{executionError}</Alert>}

            <div>
              <label className="block mb-1 text-sm text-slate-300">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter prompt for the agent..."
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                Do not enter API keys, passwords, tokens, or other secrets in your prompt.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => { void handleExecute(); }}>
                {executing ? (
                  <div className="flex items-center gap-2">
                    <Spinner />
                    <span>Executing...</span>
                  </div>
                ) : (
                  'Run Agent'
                )}
              </Button>
              <button
                type="button"
                onClick={() => setTestingAgent(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>

            {executionResult && (
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Output</span>
                  <div className="flex gap-2 items-center">
                    <Badge>{executionResult.provider}</Badge>
                    <span className="font-mono text-slate-300">{executionResult.model}</span>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-200 bg-slate-900 p-3 rounded border border-slate-800">
                  {executionResult.output}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading agents...</span>
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400">
          <p className="text-lg font-medium text-slate-300">No agents yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first AI agent to start building intelligent workflows.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <div className="flex flex-col justify-between p-6 h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-lg">{agent.name}</h3>
                    <Badge>{agent.provider}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Model: {agent.model}</p>
                  <p className="mt-1 text-xs text-slate-500">Project: {projectNameById(agent.projectId)}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                  <button onClick={() => startTesting(agent)} className="rounded px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-slate-800">
                    Test Agent
                  </button>
                  <button onClick={() => startEditing(agent)} className="rounded px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-slate-800">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(agent.id, agent.name)} className="rounded px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-slate-800">
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
