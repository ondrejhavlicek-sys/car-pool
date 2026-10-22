import { Link } from 'react-router-dom'
import { formatKm } from '../domain/dates'
import type { ReminderStatus } from '../domain/reminders'
import { EmptyState, Plate, StatusBadge } from '../ui/components'
import { useStore } from '../store'

export default function Vehicles() {
  const { db, reminders } = useStore()

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
              <Link key={v.id} to={`/vehicles/${v.id}`} className={`card card-link card-${worst}`}>
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
                  <span>{formatKm(v.odometerKm)}</span>
                  <span>{v.fuel}</span>
                </div>
                {next && <div className="card-next">Next: {next.title}</div>}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
