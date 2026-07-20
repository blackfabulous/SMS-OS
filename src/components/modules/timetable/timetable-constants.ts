export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export const PERIODS = [
  'Period 1',
  'Period 2',
  'Period 3',
  'Period 4',
  'Period 5',
  'Period 6',
  'Period 7',
  'Period 8',
]

export const PERIOD_TIMES = [
  '07:30-08:10',
  '08:10-08:50',
  '08:50-09:30',
  '09:30-10:10',
  '10:30-11:10',
  '11:10-11:50',
  '11:50-12:30',
  '14:00-14:40',
]

export const SUBJECT_PALETTE = [
  { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', bg: 'bg-emerald-50' },
  { color: 'bg-teal-100 text-teal-800 border-teal-300', bg: 'bg-teal-50' },
  { color: 'bg-cyan-100 text-cyan-800 border-cyan-300', bg: 'bg-cyan-50' },
  { color: 'bg-amber-100 text-amber-800 border-amber-300', bg: 'bg-amber-50' },
  { color: 'bg-orange-100 text-orange-800 border-orange-300', bg: 'bg-orange-50' },
  { color: 'bg-rose-100 text-rose-800 border-rose-300', bg: 'bg-rose-50' },
  { color: 'bg-violet-100 text-violet-800 border-violet-300', bg: 'bg-violet-50' },
  { color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300', bg: 'bg-fuchsia-50' },
  { color: 'bg-lime-100 text-lime-800 border-lime-300', bg: 'bg-lime-50' },
  { color: 'bg-sky-100 text-sky-800 border-sky-300', bg: 'bg-sky-50' },
  { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', bg: 'bg-indigo-50' },
  { color: 'bg-pink-100 text-pink-800 border-pink-300', bg: 'bg-pink-50' },
]

export function hashIdx(key: string, mod: number) {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h % mod
}
