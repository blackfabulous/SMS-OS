export const genderColors: Record<string, string> = {
  MALE: 'bg-teal-100 text-teal-700 border-teal-200',
  FEMALE: 'bg-rose-100 text-rose-700 border-rose-200',
  MIXED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export function getCapacityColor(occupancy: number, capacity: number) {
  const rate = capacity > 0 ? occupancy / capacity : 0
  if (rate >= 1) return 'bg-red-500'
  if (rate >= 0.8) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function getCapacityBarColor(occupancy: number, capacity: number) {
  const rate = capacity > 0 ? occupancy / capacity : 0
  if (rate >= 1) return 'from-red-400 to-red-500'
  if (rate >= 0.8) return 'from-amber-400 to-amber-500'
  return 'from-emerald-400 to-teal-500'
}
