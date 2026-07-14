import { describe, it, expect } from "vitest";
import { hasCapacity, remainingSeats, sortWaitlist, promoteWaitlist, isEligibleToEnroll } from "./enrollment";

describe("enrollment algorithms", () => {
  it("reports capacity available", () => {
    expect(hasCapacity({ classId: "c1", capacity: 30, currentEnrollments: 25 })).toBe(true);
  });

  it("reports capacity full", () => {
    expect(hasCapacity({ classId: "c1", capacity: 30, currentEnrollments: 30 })).toBe(false);
  });

  it("calculates remaining seats", () => {
    expect(remainingSeats({ classId: "c1", capacity: 30, currentEnrollments: 27 })).toBe(3);
    expect(remainingSeats({ classId: "c1", capacity: 30, currentEnrollments: 35 })).toBe(0);
  });

  it("sorts waitlist by priority then requestedAt", () => {
    const entries = [
      { studentId: "s1", requestedAt: new Date("2025-01-02"), priority: 1 },
      { studentId: "s2", requestedAt: new Date("2025-01-01"), priority: 2 },
      { studentId: "s3", requestedAt: new Date("2025-01-01"), priority: 1 },
    ];

    const sorted = sortWaitlist(entries);
    expect(sorted[0].studentId).toBe("s2");
    expect(sorted[1].studentId).toBe("s3");
    expect(sorted[2].studentId).toBe("s1");
  });

  it("promotes waitlist based on open seats", () => {
    const capacity = { classId: "c1", capacity: 30, currentEnrollments: 28 };
    const entries = [
      { studentId: "s1", requestedAt: new Date("2025-01-01") },
      { studentId: "s2", requestedAt: new Date("2025-01-02") },
      { studentId: "s3", requestedAt: new Date("2025-01-03") },
    ];

    const { promoted, remaining } = promoteWaitlist(capacity, entries);
    expect(promoted).toEqual(["s1", "s2"]);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].studentId).toBe("s3");
  });

  it("checks grade eligibility", () => {
    expect(isEligibleToEnroll(5, 4, 6)).toBe(true);
    expect(isEligibleToEnroll(3, 4, 6)).toBe(false);
    expect(isEligibleToEnroll(7, 4, 6)).toBe(false);
  });
});
