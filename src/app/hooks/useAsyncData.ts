import { useCallback, useEffect, useRef, useState } from 'react';

/* eslint-disable react-hooks/set-state-in-effect */

interface UseAsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsyncData<T>(
  loader: (forceRefresh?: boolean) => Promise<T>,
  deps: unknown[] = [],
) {
  const loaderRef = useRef(loader);
  const [state, setState] = useState<UseAsyncDataState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    loaderRef.current = loader;
  });

  const run = useCallback(async (forceRefresh = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await loaderRef.current(forceRefresh);
      setState({ data: result, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run, ...deps]);

  return {
    ...state,
    refetch: run,
  };
}

/* eslint-enable react-hooks/set-state-in-effect */
