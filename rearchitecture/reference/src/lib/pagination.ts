export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor?: string | null;
  total?: number;
}

export interface CursorPaginationArgs {
  cursor?: string;
  limit: number;
  direction?: "next" | "prev";
}

/** Encode an arbitrary object as an opaque, URL-safe cursor. */
export function encodeCursor(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

/** Decode a cursor created by `encodeCursor`. */
export function decodeCursor(cursor: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
}

export function cursorKey(value: unknown, id: string): string {
  return encodeCursor({ v: value, id });
}

/**
 * Build a Prisma `where` clause for cursor-based pagination on a single sort field.
 * This assumes the caller will order by the same field, with `id` as a tie-breaker.
 */
export function buildCursorWhere(
  cursor: string | undefined,
  sortField: string,
  direction: "asc" | "desc" = "asc"
): Record<string, unknown> | undefined {
  if (!cursor) return undefined;

  const { v: value, id } = decodeCursor(cursor) as { v: unknown; id: string };

  const order = direction === "asc" ? "gt" : "lt";
  return {
    OR: [
      { [sortField]: { [order]: value } },
      {
        [sortField]: value,
        id: { [order]: id },
      },
    ],
  };
}

/**
 * Paginate an already-sorted array of items. Useful for in-memory tests or small datasets.
 * For DB-level pagination, use `buildCursorWhere` and request `limit + 1`.
 */
export function paginateByCursor<T extends { id: string }>(
  items: T[],
  limit: number,
  cursor: string | null | undefined,
  sortExtractor?: (item: T) => unknown
): Page<T> {
  const decoded = cursor ? (decodeCursor(cursor) as { v: unknown; id: string }) : undefined;
  const startIndex = decoded
    ? items.findIndex((item) => item.id === decoded.id)
    : -1;

  const start = startIndex === -1 ? 0 : startIndex + 1;
  const page = items.slice(start, start + limit);
  const hasMore = items.length > start + limit;

  const nextItem = hasMore ? items[start + limit] : null;
  const nextCursor = nextItem
    ? encodeCursor({ v: sortExtractor ? sortExtractor(nextItem) : nextItem.id, id: nextItem.id })
    : null;

  return { items: page, nextCursor };
}

/** Build a simple offset pagination helper. */
export function paginateByOffset<T>(items: T[], offset: number, limit: number): Page<T> {
  const page = items.slice(offset, offset + limit);
  return {
    items: page,
    nextCursor: items.length > offset + limit ? String(offset + limit) : null,
  };
}
