import { Link } from 'react-router-dom'
import { EmptyState, ReminderRow } from '../ui/components'
import { useStore } from '../store'

export default function Dashboard() {
  const { db, reminders } = useStore()
  const vehicles = new Map(db.vehicles.map((v) => [v.id, v]))
  const overdue = reminders.filter((r) => r.status === 'overdue').length
  const soon = reminders.filter((r) => r.status === 'soon').length
  const attention = reminders.filter((r) => r.status !== 'ok')
  const later = reminders.filter((r) => r.status === 'ok')

  return (
    <>
      <h1>Overview</h1>

      <section className="stats">
        <div className="stat">
          <span className="stat-value">{db.vehicles.length}</span>
          <span className="muted">vehicles</span>
        </div>
        <div className={`stat ${overdue ? 'stat-overdue' : ''}`}>
          <span className="stat-value">{overdue}</span>
          <span className="muted">overdue</span>
        </div>
        <div className={`stat ${soon ? 'stat-soon' : ''}`}>
          <span className="stat-value">{soon}</span>
          <span className="muted">due soon</span>
        </div>
      </section>

      <section>
        <h2>Needs attention</h2>
        {attention.length === 0 ? (
          <EmptyState>Nothing is due. Enjoy the drive. 🚗</EmptyState>
        ) : (
          <ul className="list">
            {attention.map((r) => (
              <ReminderRow key={r.id} reminder={r} vehicle={vehicles.get(r.vehicleId)} />
            ))}
          </ul>
        )}
      </section>

      {later.length > 0 && (
        <section>
          <h2>Coming up later</h2>
          <ul className="list">
            {later.map((r) => (
              <ReminderRow key={r.id} reminder={r} vehicle={vehicles.get(r.vehicleId)} />
            ))}
          </ul>
        </section>
      )}

      {db.vehicles.length === 0 && (
        <EmptyState>
          No vehicles yet. <Link to="/vehicles/new">Add your first one</Link>.
        </EmptyState>
      )}
    </>
  )
}
