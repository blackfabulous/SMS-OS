export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  roomId?: string;
  teacherId?: string;
  classId?: string;
  subjectId?: string;
}

export interface TimetableConflict {
  slotA: TimetableSlot;
  slotB: TimetableSlot;
  reason: "ROOM" | "TEACHER" | "CLASS";
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function overlaps(a: TimetableSlot, b: TimetableSlot): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  const aStart = parseTime(a.startTime);
  const aEnd = parseTime(a.endTime);
  const bStart = parseTime(b.startTime);
  const bEnd = parseTime(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Detect conflicts in a list of timetable slots.
 * A conflict occurs when two slots overlap on the same day and share
 * the same room, teacher, or class.
 */
export function detectConflicts(slots: TimetableSlot[]): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];

      if (!overlaps(a, b)) continue;

      const reasons: TimetableConflict["reason"][] = [];
      if (a.roomId && b.roomId && a.roomId === b.roomId) reasons.push("ROOM");
      if (a.teacherId && b.teacherId && a.teacherId === b.teacherId) reasons.push("TEACHER");
      if (a.classId && b.classId && a.classId === b.classId) reasons.push("CLASS");

      for (const reason of reasons) {
        conflicts.push({ slotA: a, slotB: b, reason });
      }
    }
  }

  return conflicts;
}

/**
 * Check whether a new slot can be inserted without conflicts.
 */
export function canInsertSlot(newSlot: TimetableSlot, existingSlots: TimetableSlot[]): boolean {
  return detectConflicts([...existingSlots, newSlot]).length === 0;
}

/**
 * Suggest an alternative time range for a slot by scanning a list of candidate slots.
 */
export function suggestAlternativeSlots(
  newSlot: TimetableSlot,
  existingSlots: TimetableSlot[],
  candidates: TimetableSlot[]
): TimetableSlot[] {
  return candidates.filter((candidate) => {
    const testSlot = { ...newSlot, ...candidate, id: newSlot.id };
    return canInsertSlot(testSlot, existingSlots);
  });
}
