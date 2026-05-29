export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function paginated<T>(
  items: T[],
  total: number,
  query: { page: number; limit: number },
): PaginatedResult<T> {
  return { items, total, page: query.page, limit: query.limit };
}
