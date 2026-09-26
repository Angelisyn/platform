import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, SuspenseProps } from 'react';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { findingsService } from '@/services/findings.service';
import { scansService } from '@/services/scans.service';
import { makeScan } from '@/test/fixtures';
import type { Scan } from '@/types/scans';
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
const cancelMock = vi.mocked(scansService.cancel);

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
    cancelMock.mockReset();
    cancelMock.mockResolvedValue(undefined);
    getByScanMock.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
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

/** Flushes promise chains + React work while fake timers are active. */
async function flushUi() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe('ScanDetailPage polling lifecycle', () => {
  beforeEach(() => {
    getByIdMock.mockReset();
    getByScanMock.mockReset();
    cancelMock.mockReset();
    cancelMock.mockResolvedValue(undefined);
    getByScanMock.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('stops polling after the scan reaches COMPLETED', async () => {
    vi.useFakeTimers();
    getByIdMock
      .mockResolvedValueOnce(makeScan({ status: 'RUNNING' }))
      .mockResolvedValue(makeScan({ status: 'COMPLETED' }));

    renderPage();
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Polling for updates...')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Polling for updates...')).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(2);
  });

  it('stops polling after the scan reaches FAILED', async () => {
    vi.useFakeTimers();
    getByIdMock
      .mockResolvedValueOnce(makeScan({ status: 'RUNNING' }))
      .mockResolvedValue(makeScan({ status: 'FAILED', errorDetails: 'scanner crashed' }));

    renderPage();
    await flushUi();
    expect(screen.getByText('Polling for updates...')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Polling for updates...')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel Scan' })).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(2);
  });

  it('stops polling on cancellation and ignores the stale in-flight response', async () => {
    vi.useFakeTimers();
    let resolveStalePoll!: (scan: Scan) => void;
    const stalePoll = new Promise<Scan>((resolve) => {
      resolveStalePoll = resolve;
    });
    getByIdMock
      .mockResolvedValueOnce(makeScan({ status: 'RUNNING' }))
      .mockImplementationOnce(() => stalePoll)
      .mockResolvedValue(
        makeScan({ status: 'FAILED', errorDetails: 'Scan execution cancelled by user request' }),
      );

    renderPage();
    await flushUi();
    expect(screen.getByText('Polling for updates...')).toBeTruthy();

    // Fire one poll tick that stays in flight
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(2);

    // User cancels → backend FAILED → frontend refresh shows FAILED
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Scan' }));
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(3);
    expect(screen.queryByText('Polling for updates...')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel Scan' })).toBeNull();

    // The stale in-flight poll now resolves with old RUNNING data → must be ignored
    await act(async () => {
      resolveStalePoll(makeScan({ status: 'RUNNING' }));
      await vi.advanceTimersByTimeAsync(0);
    });
    await flushUi();
    expect(screen.queryByText('Polling for updates...')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel Scan' })).toBeNull();

    // And polling must not resume
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(3);
  });

  it('a stale RUNNING response cannot overwrite a newer COMPLETED state', async () => {
    vi.useFakeTimers();
    let resolveStalePoll!: (scan: Scan) => void;
    const stalePoll = new Promise<Scan>((resolve) => {
      resolveStalePoll = resolve;
    });
    getByIdMock
      .mockResolvedValueOnce(makeScan({ status: 'RUNNING' }))
      .mockImplementationOnce(() => stalePoll)
      .mockResolvedValue(makeScan({ status: 'COMPLETED' }));

    renderPage();
    await flushUi();
    expect(screen.getByText('Polling for updates...')).toBeTruthy();

    // Poll #1 stays in flight (stale), poll #2 resolves COMPLETED and stops polling
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(3);
    expect(screen.queryByText('Polling for updates...')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel Scan' })).toBeNull();

    // Stale RUNNING resolves late → must not resurrect running state
    await act(async () => {
      resolveStalePoll(makeScan({ status: 'RUNNING' }));
      await vi.advanceTimersByTimeAsync(0);
    });
    await flushUi();
    expect(screen.queryByText('Polling for updates...')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel Scan' })).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });
    await flushUi();
    expect(getByIdMock).toHaveBeenCalledTimes(3);
  });
});

describe('ScanDetailPage failed-scan findings messaging', () => {
  beforeEach(() => {
    getByIdMock.mockReset();
    getByScanMock.mockReset();
    cancelMock.mockReset();
    cancelMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('does not promise findings after completion for a FAILED scan', async () => {
    getByIdMock.mockResolvedValue(
      makeScan({ status: 'FAILED', errorDetails: 'scanner crashed' }),
    );
    getByScanMock.mockResolvedValue([]);

    renderPage();
    await screen.findAllByText('Test Scan');

    fireEvent.click(screen.getByRole('button', { name: 'Findings (0)' }));

    expect(
      await screen.findByText(
        'This scan failed before completion, so no findings were generated.',
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText('Findings will appear here after scan completion.'),
    ).toBeNull();
  });

  it('still shows the correct empty messaging for a COMPLETED scan', async () => {
    getByIdMock.mockResolvedValue(makeScan({ status: 'COMPLETED' }));
    getByScanMock.mockResolvedValue([]);

    renderPage();
    await screen.findAllByText('Test Scan');

    fireEvent.click(screen.getByRole('button', { name: 'Findings (0)' }));

    expect(await screen.findByText('No findings reported for this scan.')).toBeTruthy();
    expect(
      screen.queryByText('Findings will appear here after scan completion.'),
    ).toBeNull();
  });
});
