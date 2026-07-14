import { describe, it, expect } from "vitest";
import { detectConflicts, canInsertSlot } from "./timetable";

describe("timetable algorithms", () => {
  it("detects room conflict on overlapping times", () => {
    const slots = [
      { id: "1", dayOfWeek: 1, startTime: "08:00", endTime: "09:00", roomId: "R1" },
      { id: "2", dayOfWeek: 1, startTime: "08:30", endTime: "09:30", roomId: "R1" },
    ];

    const conflicts = detectConflicts(slots);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].reason).toBe("ROOM");
  });

  it("detects teacher conflict on overlapping times", () => {
    const slots = [
      { id: "1", dayOfWeek: 1, startTime: "10:00", endTime: "11:00", teacherId: "T1" },
      { id: "2", dayOfWeek: 1, startTime: "10:00", endTime: "11:00", teacherId: "T1" },
    ];

    const conflicts = detectConflicts(slots);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].reason).toBe("TEACHER");
  });

  it("returns no conflict for non-overlapping slots", () => {
    const slots = [
      { id: "1", dayOfWeek: 1, startTime: "08:00", endTime: "09:00", roomId: "R1", teacherId: "T1" },
      { id: "2", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", roomId: "R1", teacherId: "T1" },
    ];

    const conflicts = detectConflicts(slots);
    expect(conflicts).toHaveLength(0);
  });

  it("returns no conflict for different days", () => {
    const slots = [
      { id: "1", dayOfWeek: 1, startTime: "08:00", endTime: "09:00", roomId: "R1" },
      { id: "2", dayOfWeek: 2, startTime: "08:00", endTime: "09:00", roomId: "R1" },
    ];

    const conflicts = detectConflicts(slots);
    expect(conflicts).toHaveLength(0);
  });

  it("canInsertSlot returns false when conflict exists", () => {
    const existing = [{ id: "1", dayOfWeek: 1, startTime: "08:00", endTime: "09:00", roomId: "R1" }];
    const newSlot = { id: "2", dayOfWeek: 1, startTime: "08:30", endTime: "09:30", roomId: "R1" };

    expect(canInsertSlot(newSlot, existing)).toBe(false);
  });
});
