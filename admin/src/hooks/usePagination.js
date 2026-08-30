import { useState, useCallback } from 'react';

export function usePagination(defaultPage = 1, defaultLimit = 20) {
  const [page, setPage] = useState(defaultPage);
  const [limit] = useState(defaultLimit);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goToPage = useCallback((p) => setPage(p), []);

  return { page, limit, nextPage, prevPage, goToPage, setPage };
}
