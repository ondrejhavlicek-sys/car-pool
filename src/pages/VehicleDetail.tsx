import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatCzk, formatDate, formatKm, today } from '../domain/dates'
import { policyReminder, taskReminder } from '../domain/reminders'
import {
  FUEL_LABEL,
  POLICY_LABEL,
  SERVICE_LABEL,
  type InsurancePolicy,
  type PolicyKind,
  type ServiceKind,
  type ServiceTask,
  type Vehicle,
} from '../domain/types'
import { addMonths } from '../domain/dates'
import { EmptyState, Field, FormActions, Modal, Plate, ReminderRow, formValues, num } from '../ui/components'
import { newId, useStore } from '../store'

type Tab = 'overview' | 'insurance' | 'service'

export default function VehicleDetail() {
  const { id } = useParams()
  const { db } = useStore()
  const vehicle = db.vehicles.find((v) => v.id === id)
  const [tab, setTab] = useState<Tab>('overview')

  if (!vehicle) return <p>Vehicle not found. <Link to="/vehicles">Back to vehicles</Link></p>

  return (
    <>
      <Link to="/vehicles" className="back">
        ← Vehicles
      </Link>
      <div className="page-head">
        <div>
          <h1>{vehicle.nickname}</h1>
          <span className="muted">
            {vehicle.make} {vehicle.model} · {vehicle.year}
          </span>
        </div>
        <Plate value={vehicle.plate} />
      </div>

      <nav className="tabs" role="tablist">
        {(['overview', 'insurance', 'service'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tab ${tab === t ? 'tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'overview' ? 'Overview' : t === 'insurance' ? 'Insurance' : 'Service'}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <Overview vehicle={vehicle} />}
      {tab === 'insurance' && <InsuranceTab vehicle={vehicle} />}
      {tab === 'service' && <ServiceTab vehicle={vehicle} />}
    </>
  )
}

/* ------------------------------------------------------------------ overview */

function Overview({ vehicle }: { vehicle: Vehicle }) {
  const { reminders, save } = useStore()
  const [editingKm, setEditingKm] = useState(false)
  const mine = reminders.filter((r) => r.vehicleId === vehicle.id && r.status !== 'ok')

  const rows: [string, string][] = [
    ['VIN', vehicle.vin || '—'],
    ['Fuel', FUEL_LABEL[vehicle.fuel]],
    ['Power', vehicle.engineKw ? `${vehicle.engineKw} kW` : '—'],
    ['Colour', vehicle.color || '—'],
    ['Data source', vehicle.source === 'registry' ? 'Czech vehicle registry' : 'Entered manually'],
  ]

  return (
    <>
      <section className="panel">
        <div className="odo">
          <div>
            <span className="muted">Odometer</span>
            <strong className="odo-value">{formatKm(vehicle.odometerKm)}</strong>
          </div>
          <button className="btn" onClick={() => setEditingKm(true)}>
            Update
          </button>
        </div>
      </section>

      {mine.length > 0 && (
        <section>
          <h2>Needs attention</h2>
          <ul className="list">
            {mine.map((r) => (
              <ReminderRow key={r.id} reminder={r} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="page-head">
          <h2>Details</h2>
          <Link to={`/vehicles/${vehicle.id}/edit`} className="btn">
            Edit
          </Link>
        </div>
        <dl className="facts">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {vehicle.notes && <p className="notes">{vehicle.notes}</p>}
      </section>

      {editingKm && (
        <Modal title="Update odometer" onClose={() => setEditingKm(false)}>
          <form
            className="form"
            onSubmit={async (e) => {
              const f = formValues(e)
              await save('vehicles', { ...vehicle, odometerKm: num(f.km) ?? vehicle.odometerKm })
              setEditingKm(false)
            }}
          >
            <Field label="Current reading (km)">
              <input name="km" type="number" min={0} required autoFocus defaultValue={vehicle.odometerKm} />
            </Field>
            <FormActions onCancel={() => setEditingKm(false)} />
          </form>
        </Modal>
      )}
    </>
  )
}

/* ----------------------------------------------------------------- insurance */

function InsuranceTab({ vehicle }: { vehicle: Vehicle }) {
  const { db, save, remove } = useStore()
  const [editing, setEditing] = useState<InsurancePolicy | 'new' | null>(null)
  const policies = db.policies.filter((p) => p.vehicleId === vehicle.id)

  async function renew(p: InsurancePolicy) {
    await save('policies', { ...p, validFrom: p.renewalDate, renewalDate: addMonths(p.renewalDate, 12) })
  }

  return (
    <>
      <div className="page-head">
        <h2>Policies</h2>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add policy
        </button>
      </div>

      {policies.length === 0 ? (
        <EmptyState>No insurance recorded for this vehicle.</EmptyState>
      ) : (
        <ul className="list">
          {policies.map((p) => (
            <li key={p.id} className="card policy">
              <ul className="list list-flush">
                <ReminderRow reminder={policyReminder(p, POLICY_LABEL[p.kind])} />
              </ul>
              <div className="policy-meta muted">
                <span>{p.insurer}</span>
                <span>№ {p.policyNumber || '—'}</span>
                {p.premiumCzk !== undefined && <span>{formatCzk(p.premiumCzk)} / year</span>}
                <span>
                  {formatDate(p.validFrom)} → {formatDate(p.renewalDate)}
                </span>
                <span>Reminder {p.remindDaysBefore} d before</span>
              </div>
              <div className="actions">
                <button className="btn btn-sm" onClick={() => renew(p)} title="Roll the policy forward by 12 months">
                  Mark renewed (+12 mo)
                </button>
                <button className="btn btn-sm" onClick={() => setEditing(p)}>
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => confirm('Delete this policy?') && remove('policies', p.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && <PolicyModal vehicle={vehicle} policy={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function PolicyModal({ vehicle, policy, onClose }: { vehicle: Vehicle; policy?: InsurancePolicy; onClose: () => void }) {
  const { save } = useStore()
  return (
    <Modal title={policy ? 'Edit policy' : 'Add insurance policy'} onClose={onClose}>
      <form
        className="form"
        onSubmit={async (e) => {
          const f = formValues(e)
          await save('policies', {
            id: policy?.id ?? newId(),
            vehicleId: vehicle.id,
            kind: f.kind as PolicyKind,
            insurer: f.insurer,
            policyNumber: f.policyNumber,
            premiumCzk: num(f.premium),
            validFrom: f.validFrom,
            renewalDate: f.renewalDate,
            remindDaysBefore: num(f.remind) ?? 30,
          })
          onClose()
        }}
      >
        <Field label="Type">
          <select name="kind" defaultValue={policy?.kind ?? 'liability'}>
            {Object.entries(POLICY_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <div className="row">
          <Field label="Insurer">
            <input name="insurer" required defaultValue={policy?.insurer} />
          </Field>
          <Field label="Policy number">
            <input name="policyNumber" defaultValue={policy?.policyNumber} />
          </Field>
        </div>
        <div className="row">
          <Field label="Valid from">
            <input name="validFrom" type="date" required defaultValue={policy?.validFrom ?? today()} />
          </Field>
          <Field label="Renewal date">
            <input name="renewalDate" type="date" required defaultValue={policy?.renewalDate ?? addMonths(today(), 12)} />
          </Field>
        </div>
        <div className="row">
          <Field label="Yearly premium (Kč)">
            <input name="premium" type="number" min={0} defaultValue={policy?.premiumCzk} />
          </Field>
          <Field label="Remind me (days before)">
            <input name="remind" type="number" min={0} required defaultValue={policy?.remindDaysBefore ?? 30} />
          </Field>
        </div>
        <FormActions onCancel={onClose} />
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------- service */

function ServiceTab({ vehicle }: { vehicle: Vehicle }) {
  const { db, remove } = useStore()
  const [editing, setEditing] = useState<ServiceTask | 'new' | null>(null)
  const [completing, setCompleting] = useState<ServiceTask | null>(null)
  const tasks = db.tasks.filter((t) => t.vehicleId === vehicle.id)
  const records = db.records
    .filter((r) => r.vehicleId === vehicle.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <div className="page-head">
        <h2>Maintenance schedule</h2>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add task
        </button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState>No scheduled maintenance yet.</EmptyState>
      ) : (
        <ul className="list">
          {tasks.map((t) => {
            const r = taskReminder(t, vehicle)
            const interval = [
              t.intervalMonths && `every ${t.intervalMonths} mo`,
              t.intervalKm && `every ${formatKm(t.intervalKm)}`,
            ]
              .filter(Boolean)
              .join(' / ')
            return (
              <li key={t.id} className="card policy">
                {r ? (
                  <ul className="list list-flush">
                    <ReminderRow reminder={r} />
                  </ul>
                ) : (
                  <strong>{t.title}</strong>
                )}
                <div className="policy-meta muted">
                  <span>{SERVICE_LABEL[t.kind]}</span>
                  <span>{interval || 'no interval set'}</span>
                  {t.lastDoneDate && (
                    <span>
                      last: {formatDate(t.lastDoneDate)}
                      {t.lastDoneKm !== undefined && ` @ ${formatKm(t.lastDoneKm)}`}
                    </span>
                  )}
                </div>
                <div className="actions">
                  <button className="btn btn-sm btn-primary" onClick={() => setCompleting(t)}>
                    Mark done
                  </button>
                  <button className="btn btn-sm" onClick={() => setEditing(t)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => confirm('Delete this task?') && remove('tasks', t.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="page-head">
        <h2>History</h2>
        <button className="btn" onClick={() => setCompleting({ id: '', vehicleId: vehicle.id, title: '', kind: 'other', remindDaysBefore: 0, remindKmBefore: 0 })}>
          + Log one-off service
        </button>
      </div>
      {records.length === 0 ? (
        <EmptyState>No service history yet.</EmptyState>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>What</th>
              <th>Odometer</th>
              <th>Cost</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{formatDate(r.date)}</td>
                <td>
                  {r.title}
                  {r.notes && <div className="muted">{r.notes}</div>}
                </td>
                <td>{formatKm(r.km)}</td>
                <td>{r.costCzk !== undefined ? formatCzk(r.costCzk) : '—'}</td>
                <td>
                  <button
                    className="btn btn-sm btn-ghost"
                    aria-label="Delete record"
                    onClick={() => confirm('Delete this record?') && remove('records', r.id)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && <TaskModal vehicle={vehicle} task={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {completing && <CompleteModal vehicle={vehicle} task={completing} onClose={() => setCompleting(null)} />}
    </>
  )
}

function TaskModal({ vehicle, task, onClose }: { vehicle: Vehicle; task?: ServiceTask; onClose: () => void }) {
  const { save } = useStore()
  return (
    <Modal title={task ? 'Edit task' : 'Add maintenance task'} onClose={onClose}>
      <form
        className="form"
        onSubmit={async (e) => {
          const f = formValues(e)
          await save('tasks', {
            id: task?.id ?? newId(),
            vehicleId: vehicle.id,
            title: f.title,
            kind: f.kind as ServiceKind,
            intervalMonths: num(f.months),
            intervalKm: num(f.km),
            lastDoneDate: f.lastDate || undefined,
            lastDoneKm: num(f.lastKm),
            remindDaysBefore: num(f.remindDays) ?? 0,
            remindKmBefore: num(f.remindKm) ?? 0,
          })
          onClose()
        }}
      >
        <div className="row">
          <Field label="Title">
            <input name="title" required autoFocus defaultValue={task?.title} placeholder="Oil & filter change" />
          </Field>
          <Field label="Category">
            <select name="kind" defaultValue={task?.kind ?? 'oil'}>
              {Object.entries(SERVICE_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="row">
          <Field label="Repeat every (months)" hint="Leave empty to ignore time">
            <input name="months" type="number" min={1} defaultValue={task?.intervalMonths} />
          </Field>
          <Field label="Repeat every (km)" hint="Leave empty to ignore mileage">
            <input name="km" type="number" min={1} defaultValue={task?.intervalKm} />
          </Field>
        </div>
        <div className="row">
          <Field label="Last done on">
            <input name="lastDate" type="date" defaultValue={task?.lastDoneDate} />
          </Field>
          <Field label="Last done at (km)">
            <input name="lastKm" type="number" min={0} defaultValue={task?.lastDoneKm} />
          </Field>
        </div>
        <div className="row">
          <Field label="Remind (days before)">
            <input name="remindDays" type="number" min={0} defaultValue={task?.remindDaysBefore ?? 30} />
          </Field>
          <Field label="Remind (km before)">
            <input name="remindKm" type="number" min={0} defaultValue={task?.remindKmBefore ?? 1000} />
          </Field>
        </div>
        <FormActions onCancel={onClose} />
      </form>
    </Modal>
  )
}

/** Completes a scheduled task (task.id set) or logs a one-off visit (task.id empty). */
function CompleteModal({ vehicle, task, onClose }: { vehicle: Vehicle; task: ServiceTask; onClose: () => void }) {
  const { save } = useStore()
  const scheduled = task.id !== ''

  return (
    <Modal title={scheduled ? `Done: ${task.title}` : 'Log service'} onClose={onClose}>
      <form
        className="form"
        onSubmit={async (e) => {
          const f = formValues(e)
          const km = num(f.km) ?? vehicle.odometerKm
          await save('records', {
            id: newId(),
            vehicleId: vehicle.id,
            taskId: scheduled ? task.id : undefined,
            title: f.title,
            date: f.date,
            km,
            costCzk: num(f.cost),
            notes: f.notes || undefined,
          })
          if (scheduled) await save('tasks', { ...task, lastDoneDate: f.date, lastDoneKm: km })
          if (km > vehicle.odometerKm) await save('vehicles', { ...vehicle, odometerKm: km })
          onClose()
        }}
      >
        <Field label="What was done">
          <input name="title" required defaultValue={task.title} placeholder="e.g. Clutch replacement" />
        </Field>
        <div className="row">
          <Field label="Date">
            <input name="date" type="date" required defaultValue={today()} />
          </Field>
          <Field label="Odometer (km)">
            <input name="km" type="number" min={0} required defaultValue={vehicle.odometerKm} />
          </Field>
          <Field label="Cost (Kč)">
            <input name="cost" type="number" min={0} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea name="notes" rows={2} />
        </Field>
        {scheduled && <p className="muted">The next due date and mileage are recalculated from this entry.</p>}
        <FormActions onCancel={onClose} submitLabel="Save" />
      </form>
    </Modal>
  )
}
