import type { Db, Id, IsoDate } from './types'

export interface OdometerReading {
  km: number
  date?: IsoDate
}

/**
 * The odometer is not stored on the vehicle – it changes constantly. The best
 * known value is the highest reading entered with a service event (or as a
 * task's "last done at" value).
 */
export function latestReading(db: Db, vehicleId: Id): OdometerReading | undefined {
  const readings: OdometerReading[] = [
    ...db.records.filter((r) => r.vehicleId === vehicleId).map((r) => ({ km: r.km, date: r.date })),
    ...db.tasks
      .filter((t) => t.vehicleId === vehicleId && t.lastDoneKm !== undefined)
      .map((t) => ({ km: t.lastDoneKm as number, date: t.lastDoneDate })),
  ]
  return readings.reduce<OdometerReading | undefined>((best, r) => (!best || r.km > best.km ? r : best), undefined)
}
