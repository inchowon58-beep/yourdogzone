export const LIST_PAGE_SIZE = 10;

export function paginate<T>(
  items: readonly T[],
  page: number,
  perPage = LIST_PAGE_SIZE
) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const offset = (safePage - 1) * perPage;

  return {
    items: items.slice(offset, offset + perPage),
    page: safePage,
    totalPages,
    totalItems,
    perPage,
  };
}

export function parsePageParam(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
