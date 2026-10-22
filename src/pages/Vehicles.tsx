import { Link } from 'react-router-dom'
import type { ReminderStatus } from '../domain/reminders'
import { EmptyState, Plate, StatusBadge } from '../ui/components'
import { useRemoveVehicle } from '../ui/useRemoveVehicle'
import { useStore } from '../store'

export default function Vehicles() {
  const { db, reminders } = useStore()
  const removeVehicle = useRemoveVehicle()

  return (
    <>
      <div className="page-head">
        <h1>Vehicles</h1>
        <Link to="/vehicles/new" className="btn btn-primary">
          + Add vehicle
        </Link>
      </div>

      {db.vehicles.length === 0 ? (
        <EmptyState>No vehicles yet.</EmptyState>
      ) : (
        <div className="cards">
          {db.vehicles.map((v) => {
            const mine = reminders.filter((r) => r.vehicleId === v.id)
            const worst: ReminderStatus = mine.some((r) => r.status === 'overdue')
              ? 'overdue'
              : mine.some((r) => r.status === 'soon')
                ? 'soon'
                : 'ok'
            const next = mine[0]
            return (
              <div key={v.id} className={`card card-hover card-${worst}`}>
                <Link to={`/vehicles/${v.id}`} className="card-body">
                  <div className="card-top">
                    <div>
                      <h3>{v.nickname}</h3>
                      <span className="muted">
                        {v.make} {v.model} · {v.year}
                      </span>
                    </div>
                    <StatusBadge status={worst} />
                  </div>
                  <Plate value={v.plate} />
                  <div className="card-meta muted">
                    <span>{v.fuel}</span>
                  </div>
                  {next && <div className="card-next">Next: {next.title}</div>}
                </Link>
                <div className="actions">
                  <Link to={`/vehicles/${v.id}/edit`} className="btn btn-sm">
                    Edit
                  </Link>
                  <button className="btn btn-sm btn-danger" onClick={() => removeVehicle(v)}>
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
