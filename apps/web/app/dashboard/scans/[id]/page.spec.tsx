import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentProps, SuspenseProps } from 'react';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { findingsService } from '@/services/findings.service';
import { scansService } from '@/services/scans.service';
import { makeScan } from '@/test/fixtures';
import ScanDetailPage from './page';

vi.mock('next/link', () => ({
  default: function MockLink({ href, children, ...rest }: ComponentProps<'a'>) {
    return (
      <a href={typeof href === 'string' ? href : undefined} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock('@/services/scans.service', () => ({
  scansService: { getById: vi.fn(), cancel: vi.fn() },
}));

vi.mock('@/services/findings.service', () => ({
  findingsService: { getByScan: vi.fn() },
}));

const getByIdMock = vi.mocked(scansService.getById);
const getByScanMock = vi.mocked(findingsService.getByScan);

/**
 * React's `use()` returns the value immediately for a thenable whose status is
 * already "fulfilled", which keeps these tests deterministic under jsdom.
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
  const boundaryProps: SuspenseProps = {
    fallback: <span>Loading scan details...</span>,
  };
  return render(
    <Suspense {...boundaryProps}>
      <ScanDetailPage params={fulfilledParams('scan-1')} />
    </Suspense>,
  );
}

describe('ScanDetailPage states', () => {
  beforeEach(() => {
    getByIdMock.mockReset();
    getByScanMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the scan on a successful 200', async () => {
    getByIdMock.mockResolvedValue(makeScan({ status: 'COMPLETED' }));
    getByScanMock.mockResolvedValue([]);

    renderPage();

    expect((await screen.findAllByText('Test Scan')).length).toBeGreaterThan(0);
    expect(screen.getByText('Findings (0)')).toBeTruthy();
    expect(screen.queryAllByText('Scan Not Found')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('renders a dedicated not-found state on 404', async () => {
    getByIdMock.mockRejectedValue(new ApiError(404, 'Scan job not found'));
    getByScanMock.mockRejectedValue(new ApiError(404, 'Scan not found'));

    renderPage();

    expect((await screen.findAllByText('Scan Not Found')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('renders an error state with Retry on 500 (not a not-found state)', async () => {
    getByIdMock.mockRejectedValue(new ApiError(500, 'Internal server error'));
    getByScanMock.mockRejectedValue(new ApiError(500, 'Internal server error'));

    renderPage();

    expect(await screen.findByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.getByText('Internal server error')).toBeTruthy();
    expect(screen.queryAllByText('Scan Not Found')).toHaveLength(0);
  });

  it('renders a network-specific error state on network failure', async () => {
    getByIdMock.mockRejectedValue(new ApiError(0, 'Network connection failed: fetch failed'));
    getByScanMock.mockRejectedValue(new ApiError(0, 'Network connection failed: fetch failed'));

    renderPage();

    expect(await screen.findByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.getByText('Network connection failed: fetch failed')).toBeTruthy();
    expect(screen.queryAllByText('Scan Not Found')).toHaveLength(0);
  });
});
