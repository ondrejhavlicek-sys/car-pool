// Domain model. Field names are camelCase here; the Supabase stage will map
// them to snake_case columns inside the repository implementation.

export type Id = string
/** ISO calendar date, `YYYY-MM-DD`. */
export type IsoDate = string

export type FuelType = 'petrol' | 'diesel' | 'lpg' | 'hybrid' | 'electric' | 'other'

export interface Vehicle {
  id: Id
  nickname: string
  make: string
  model: string
  year: number
  /** SPZ – Czech licence plate. */
  plate: string
  vin: string
  fuel: FuelType
  engineKw?: number
  color?: string
  notes?: string
  /** Where the technical data came from. */
  source: 'manual' | 'registry'
}

export type PolicyKind = 'liability' | 'comprehensive' | 'other'

export interface InsurancePolicy {
  id: Id
  vehicleId: Id
  kind: PolicyKind
  insurer: string
  policyNumber: string
  /** Yearly premium in CZK. */
  premiumCzk?: number
  validFrom: IsoDate
  /** Date the policy expires / has to be renewed. */
  renewalDate: IsoDate
  remindDaysBefore: number
}

export type ServiceKind = 'oil' | 'tyres' | 'brakes' | 'inspection' | 'other'

/** A recurring maintenance obligation, e.g. "Oil change every 12 months / 15 000 km". */
export interface ServiceTask {
  id: Id
  vehicleId: Id
  title: string
  kind: ServiceKind
  intervalMonths?: number
  intervalKm?: number
  lastDoneDate?: IsoDate
  lastDoneKm?: number
  remindDaysBefore: number
  remindKmBefore: number
}

/** One completed service visit (history). */
export interface ServiceRecord {
  id: Id
  vehicleId: Id
  taskId?: Id
  title: string
  date: IsoDate
  km: number
  costCzk?: number
  notes?: string
}

export interface Db {
  vehicles: Vehicle[]
  policies: InsurancePolicy[]
  tasks: ServiceTask[]
  records: ServiceRecord[]
}

export type TableName = keyof Db
export type RowOf<T extends TableName> = Db[T][number]

export const POLICY_LABEL: Record<PolicyKind, string> = {
  liability: 'Liability (povinné ručení)',
  comprehensive: 'Comprehensive (havarijní)',
  other: 'Other',
}

export const SERVICE_LABEL: Record<ServiceKind, string> = {
  oil: 'Oil & filters',
  tyres: 'Tyres',
  brakes: 'Brakes',
  inspection: 'Technical inspection (STK)',
  other: 'Other',
}

export const FUEL_LABEL: Record<FuelType, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  lpg: 'LPG / CNG',
  hybrid: 'Hybrid',
  electric: 'Electric',
  other: 'Other',
}
