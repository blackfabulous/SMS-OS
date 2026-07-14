export interface ClassCapacity {
  classId: string;
  capacity: number;
  currentEnrollments: number;
}

export interface WaitlistEntry {
  studentId: string;
  requestedAt: Date;
  priority?: number;
}

/**
 * Determine whether a class has available capacity.
 */
export function hasCapacity(capacity: ClassCapacity): boolean {
  return capacity.currentEnrollments < capacity.capacity;
}

/**
 * Calculate remaining open seats.
 */
export function remainingSeats(capacity: ClassCapacity): number {
  return Math.max(0, capacity.capacity - capacity.currentEnrollments);
}

/**
 * Rank waitlist entries by priority (higher first), then by request time (earlier first).
 */
export function sortWaitlist(entries: WaitlistEntry[]): WaitlistEntry[] {
  return [...entries].sort((a, b) => {
    const priorityA = a.priority ?? 0;
    const priorityB = b.priority ?? 0;

    if (priorityA !== priorityB) return priorityB - priorityA;
    return a.requestedAt.getTime() - b.requestedAt.getTime();
  });
}

/**
 * Promote the highest-priority waitlist entries into a class as seats open.
 * Returns the IDs of students that should be enrolled.
 */
export function promoteWaitlist(
  capacity: ClassCapacity,
  entries: WaitlistEntry[]
): { promoted: string[]; remaining: WaitlistEntry[] } {
  const sorted = sortWaitlist(entries);
  const openSeats = remainingSeats(capacity);

  const promoted = sorted.slice(0, openSeats).map((e) => e.studentId);
  const remaining = sorted.slice(openSeats);

  return { promoted, remaining };
}

/**
 * Check whether a student is eligible to enroll based on prerequisites.
 * This is a placeholder for more complex rules.
 */
export function isEligibleToEnroll(
  studentGradeLevel: number,
  classMinGradeLevel?: number,
  classMaxGradeLevel?: number
): boolean {
  if (classMinGradeLevel !== undefined && studentGradeLevel < classMinGradeLevel) return false;
  if (classMaxGradeLevel !== undefined && studentGradeLevel > classMaxGradeLevel) return false;
  return true;
}
