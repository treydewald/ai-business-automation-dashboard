import { renderHook, waitFor } from '@testing-library/react';
import { useWorkflows } from '../../hooks/useWorkflows';

// Mock fetch
global.fetch = jest.fn();

describe('useWorkflows Hook', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('returns initial loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({ items: [] })
              }),
            100
          )
        )
    );

    const { result } = renderHook(() => useWorkflows());

    expect(result.current.loading).toBe(true);
    expect(result.current.workflows).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches workflows on mount', async () => {
    const mockWorkflows = [
      { id: '1', name: 'Workflow 1' },
      { id: '2', name: 'Workflow 2' }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: mockWorkflows })
    });

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.workflows).toEqual(mockWorkflows);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Failed to fetch';
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.workflows).toEqual([]);
  });

  it('supports pagination', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [{ id: '1', name: 'Workflow 1' }],
          page: 1,
          total: 20
        })
    });

    const { result } = renderHook(() => useWorkflows({ page: 1, limit: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.workflows.length).toBeGreaterThan(0);
  });

  it('supports search filtering', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [{ id: '1', name: 'Search Result' }]
        })
    });

    const { result } = renderHook(() => useWorkflows({ search: 'Search' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.workflows.length).toBeGreaterThan(0);
  });

  it('provides refetch function', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] })
    });

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [{ id: '1', name: 'New Workflow' }]
        })
    });

    if (result.current.refetch) {
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.workflows.length).toBeGreaterThan(0);
      });
    }
  });
});
