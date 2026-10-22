import type { Vehicle } from '../domain/types'
import { useStore } from '../store'

/** Asks for confirmation, then removes the vehicle together with its policies, tasks and history. */
export function useRemoveVehicle() {
  const { db, remove } = useStore()

  return async (v: Vehicle): Promise<boolean> => {
    const policies = db.policies.filter((p) => p.vehicleId === v.id).length
    const tasks = db.tasks.filter((t) => t.vehicleId === v.id).length
    const records = db.records.filter((r) => r.vehicleId === v.id).length
    const attached = [
      policies && `${policies} insurance polic${policies === 1 ? 'y' : 'ies'}`,
      tasks && `${tasks} maintenance task${tasks === 1 ? '' : 's'}`,
      records && `${records} service record${records === 1 ? '' : 's'}`,
    ].filter(Boolean)

    const detail = attached.length ? `\n\nThis also deletes ${attached.join(', ')}.` : ''
    if (!confirm(`Remove ${v.nickname} (${v.plate})?${detail}`)) return false

    await remove('vehicles', v.id)
    return true
  }
}
