import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { projectsService } from '@/services/projects.service';
import { targetsService } from '@/services/targets.service';
import type { Project } from '@/types/projects';
import type { Target } from '@/types/targets';
import ProjectDetailPage from './page';

vi.mock('next/link', () => ({
  default: function MockLink({ href, children, ...rest }: ComponentProps<'a'>) {
    return (
      <a href={typeof href === 'string' ? href : undefined} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/services/projects.service', () => ({
  projectsService: { getById: vi.fn() },
}));

vi.mock('@/services/targets.service', () => ({
  targetsService: { getByProject: vi.fn() },
}));

const getProjectByIdMock = vi.mocked(projectsService.getById);
const getTargetsByProjectMock = vi.mocked(targetsService.getByProject);

const project: Project = {
  id: 'project-1',
  name: 'Lab Project',
  slug: 'lab-project',
  ownerId: 'user-1',
  createdAt: '2026-09-26T09:00:00.000Z',
  updatedAt: '2026-09-26T09:00:00.000Z',
};

const target: Target = {
  id: 'target-1',
  name: 'Lab Target',
  target: '10.0.0.1',
  type: 'IP_ADDRESS',
  status: 'ACTIVE',
  projectId: 'project-1',
  createdAt: '2026-09-26T09:05:00.000Z',
};

/**
 * React's `use()` returns the value immediately for a thenable whose status is
 * already "fulfilled", keeping these tests deterministic under jsdom.
 */
function fulfilledParams(id: string): Promise<{ id: string }> {
  const thenable = {
    status: 'fulfilled' as const,
    value: { id },
    then() {
      return thenable;
    },
  };
  return thenable as unknown as Promise<{ id: string }>;
}

function renderPage() {
  return render(
    <Suspense fallback={<span>Loading project details...</span>}>
      <ProjectDetailPage params={fulfilledParams('project-1')} />
    </Suspense>,
  );
}

describe('ProjectDetailPage targets section', () => {
  beforeEach(() => {
    getProjectByIdMock.mockReset();
    getProjectByIdMock.mockResolvedValue(project);
    getTargetsByProjectMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a loading state for targets while they load', async () => {
    getTargetsByProjectMock.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect((await screen.findAllByText('Lab Project')).length).toBeGreaterThan(0);
    expect(screen.getByText('Loading targets...')).toBeTruthy();
  });

  it('renders the empty targets state on an empty successful response', async () => {
    getTargetsByProjectMock.mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText('No targets have been added to this project yet.'),
    ).toBeTruthy();
    expect(screen.queryByText('Failed to load targets')).toBeNull();
  });

  it('renders targets with navigation links on success', async () => {
    getTargetsByProjectMock.mockResolvedValue([target]);

    renderPage();

    expect(await screen.findByText('Lab Target')).toBeTruthy();
    const targetLink = screen.getByRole('link', { name: 'Lab Target' });
    expect(targetLink.getAttribute('href')).toBe('/dashboard/targets/target-1');

    const createLink = screen.getByRole('link', { name: '+ Create Target' });
    expect(createLink.getAttribute('href')).toBe('/dashboard/targets?projectId=project-1');
    expect(screen.queryByText('Failed to load targets')).toBeNull();
  });

  it('renders an error state (not the empty state) when the targets request fails', async () => {
    getTargetsByProjectMock.mockRejectedValue(new ApiError(500, 'Internal server error'));

    renderPage();

    expect(await screen.findByText('Failed to load targets')).toBeTruthy();
    expect(screen.getByText('Internal server error')).toBeTruthy();
    expect(screen.queryByText('No targets have been added to this project yet.')).toBeNull();
  });
});
