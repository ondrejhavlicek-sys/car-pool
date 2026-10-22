import type { IsoDate } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

export function toIso(d: Date): IsoDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function today(): IsoDate {
  return toIso(new Date())
}

function parse(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const d = parse(iso)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return toIso(d)
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = parse(iso)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

/** Whole days from `from` to `to` (negative when `to` is in the past). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000)
}

export function formatDate(iso: IsoDate): string {
  return parse(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

export function formatKm(km: number): string {
  return `${km.toLocaleString('cs-CZ')} km`
}

export function formatCzk(n: number): string {
  return `${n.toLocaleString('cs-CZ')} Kč`
}
