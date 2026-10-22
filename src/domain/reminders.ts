import { addDays, addMonths, daysBetween, today } from './dates'
import type { Db, Id, InsurancePolicy, IsoDate, ServiceTask, Vehicle } from './types'

export type ReminderStatus = 'overdue' | 'soon' | 'ok'

export interface Reminder {
  id: string
  vehicleId: Id
  source: 'insurance' | 'service'
  sourceId: Id
  title: string
  /** Date the item falls due (renewal date, or next service date). */
  dueDate?: IsoDate
  /** Odometer reading at which a service falls due. */
  dueKm?: number
  daysLeft?: number
  kmLeft?: number
  status: ReminderStatus
  /** Date from which the user should be reminded. */
  remindFrom?: IsoDate
}

const RANK: Record<ReminderStatus, number> = { overdue: 0, soon: 1, ok: 2 }

export function nextServiceDue(task: ServiceTask): { date?: IsoDate; km?: number } {
  const date =
    task.intervalMonths && task.lastDoneDate ? addMonths(task.lastDoneDate, task.intervalMonths) : undefined
  const km = task.intervalKm && task.lastDoneKm !== undefined ? task.lastDoneKm + task.intervalKm : undefined
  return { date, km }
}

export function policyReminder(policy: InsurancePolicy, label: string): Reminder {
  const daysLeft = daysBetween(today(), policy.renewalDate)
  return {
    id: `policy:${policy.id}`,
    vehicleId: policy.vehicleId,
    source: 'insurance',
    sourceId: policy.id,
    title: `${label} – ${policy.insurer}`,
    dueDate: policy.renewalDate,
    daysLeft,
    status: daysLeft < 0 ? 'overdue' : daysLeft <= policy.remindDaysBefore ? 'soon' : 'ok',
    remindFrom: addDays(policy.renewalDate, -policy.remindDaysBefore),
  }
}

export function taskReminder(task: ServiceTask, vehicle: Vehicle): Reminder | undefined {
  const { date, km } = nextServiceDue(task)
  if (!date && km === undefined) return undefined
  const daysLeft = date ? daysBetween(today(), date) : undefined
  const kmLeft = km !== undefined ? km - vehicle.odometerKm : undefined

  const overdue = (daysLeft !== undefined && daysLeft < 0) || (kmLeft !== undefined && kmLeft < 0)
  const soon =
    (daysLeft !== undefined && daysLeft <= task.remindDaysBefore) ||
    (kmLeft !== undefined && kmLeft <= task.remindKmBefore)

  return {
    id: `task:${task.id}`,
    vehicleId: task.vehicleId,
    source: 'service',
    sourceId: task.id,
    title: task.title,
    dueDate: date,
    dueKm: km,
    daysLeft,
    kmLeft,
    status: overdue ? 'overdue' : soon ? 'soon' : 'ok',
    remindFrom: date ? addDays(date, -task.remindDaysBefore) : undefined,
  }
}

const POLICY_TITLE: Record<InsurancePolicy['kind'], string> = {
  liability: 'Liability insurance renewal',
  comprehensive: 'Comprehensive insurance renewal',
  other: 'Insurance renewal',
}

/** All reminders for the given database, most urgent first. */
export function buildReminders(db: Db): Reminder[] {
  const vehicles = new Map(db.vehicles.map((v) => [v.id, v]))
  const out: Reminder[] = []

  for (const p of db.policies) {
    if (vehicles.has(p.vehicleId)) out.push(policyReminder(p, POLICY_TITLE[p.kind]))
  }
  for (const t of db.tasks) {
    const v = vehicles.get(t.vehicleId)
    const r = v && taskReminder(t, v)
    if (r) out.push(r)
  }

  return out.sort(
    (a, b) =>
      RANK[a.status] - RANK[b.status] ||
      (a.daysLeft ?? Number.MAX_SAFE_INTEGER) - (b.daysLeft ?? Number.MAX_SAFE_INTEGER),
  )
}
