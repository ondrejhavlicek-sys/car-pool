import { today } from '../domain/dates'
import { latestReading } from '../domain/odometer'
import type { Db, RowOf, TableName, Vehicle } from '../domain/types'
import { createSeed } from './seed'

/**
 * Persistence boundary. The prototype implements it on top of localStorage;
 * the real app will add a `SupabaseRepository` with the same shape and the
 * rest of the code stays untouched.
 */
export interface Repository {
  load(): Promise<Db>
  save<T extends TableName>(table: T, row: RowOf<T>): Promise<void>
  remove(table: TableName, id: string): Promise<void>
  /** Prototype only: restore the demo data. */
  reset(): Promise<Db>
}

const KEY = 'carpool.prototype.v1'

/**
 * Earlier prototype versions stored `odometerKm` on the vehicle. Keep that value as a
 * reading in the service history (unless history already has a higher one) and drop the field.
 */
function migrateLegacyOdometer(db: Db): Db {
  for (const v of db.vehicles as (Vehicle & { odometerKm?: number })[]) {
    const km = v.odometerKm
    delete v.odometerKm
    if (km === undefined || (latestReading(db, v.id)?.km ?? -1) >= km) continue
    db.records.push({
      id: crypto.randomUUID(),
      vehicleId: v.id,
      title: 'Odometer reading (carried over)',
      date: today(),
      km,
    })
  }
  return db
}

function read(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return migrateLegacyOdometer(JSON.parse(raw) as Db)
  } catch {
    // corrupted or unavailable storage – fall through to seed data
  }
  return createSeed()
}

function write(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // storage full / blocked: the prototype keeps working in memory only
  }
}

export class LocalRepository implements Repository {
  private db: Db = read()

  async load() {
    return structuredClone(this.db)
  }

  async save<T extends TableName>(table: T, row: RowOf<T>) {
    const rows = this.db[table] as { id: string }[]
    const i = rows.findIndex((r) => r.id === row.id)
    if (i >= 0) rows[i] = row
    else rows.push(row)
    write(this.db)
  }

  async remove(table: TableName, id: string) {
    this.db[table] = (this.db[table] as { id: string }[]).filter((r) => r.id !== id) as never
    // cascade: removing a vehicle removes everything attached to it
    if (table === 'vehicles') {
      this.db.policies = this.db.policies.filter((p) => p.vehicleId !== id)
      this.db.tasks = this.db.tasks.filter((t) => t.vehicleId !== id)
      this.db.records = this.db.records.filter((r) => r.vehicleId !== id)
    }
    write(this.db)
  }

  async reset() {
    this.db = createSeed()
    write(this.db)
    return structuredClone(this.db)
  }
}
