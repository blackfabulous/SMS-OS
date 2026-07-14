import { describe, it, expect } from "vitest";
import { encodeCursor, decodeCursor, buildCursorWhere, paginateByCursor } from "./pagination";

describe("pagination algorithms", () => {
  it("encodes and decodes a cursor", () => {
    const cursor = encodeCursor({ v: "2025-01-01", id: "abc-123" });
    const decoded = decodeCursor(cursor);
    expect(decoded).toEqual({ v: "2025-01-01", id: "abc-123" });
  });

  it("builds Prisma cursor where for ascending sort", () => {
    const where = buildCursorWhere(encodeCursor({ v: "2025-01-01", id: "abc" }), "createdAt", "asc");
    expect(where).toEqual({
      OR: [
        { createdAt: { gt: "2025-01-01" } },
        { createdAt: "2025-01-01", id: { gt: "abc" } },
      ],
    });
  });

  it("paginates an array by cursor", () => {
    const items = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
      { id: "3", name: "c" },
      { id: "4", name: "d" },
    ];

    const page = paginateByCursor(items, 2, undefined, (i) => i.name);
    expect(page.items).toHaveLength(2);
    expect(page.items[0].id).toBe("1");
    expect(page.items[1].id).toBe("2");
    expect(page.nextCursor).toBeTruthy();

    const nextPage = paginateByCursor(items, 2, page.nextCursor, (i) => i.name);
    expect(nextPage.items).toHaveLength(1);
    expect(nextPage.items[0].id).toBe("4");
    expect(nextPage.nextCursor).toBeNull();
  });
});
