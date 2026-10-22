import { useEffect, useRef, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, formatKm } from '../domain/dates'
import type { Reminder, ReminderStatus } from '../domain/reminders'
import type { Vehicle } from '../domain/types'

export function Plate({ value }: { value: string }) {
  return (
    <span className="plate">
      <span className="plate-eu">CZ</span>
      {value}
    </span>
  )
}

const STATUS_TEXT: Record<ReminderStatus, string> = { overdue: 'Overdue', soon: 'Due soon', ok: 'OK' }

export function StatusBadge({ status }: { status: ReminderStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_TEXT[status]}</span>
}

export function dueText(r: Reminder): string {
  const parts: string[] = []
  if (r.dueDate !== undefined && r.daysLeft !== undefined) {
    const when =
      r.daysLeft === 0 ? 'today' : r.daysLeft > 0 ? `in ${r.daysLeft} d` : `${-r.daysLeft} d ago`
    parts.push(`${formatDate(r.dueDate)} (${when})`)
  }
  if (r.dueKm !== undefined && r.kmLeft !== undefined) {
    const when = r.kmLeft >= 0 ? `${formatKm(r.kmLeft)} left` : `${formatKm(-r.kmLeft)} over`
    parts.push(`${formatKm(r.dueKm)} (${when})`)
  }
  return parts.join(' · ')
}

export function ReminderRow({
  reminder,
  vehicle,
  action,
}: {
  reminder: Reminder
  vehicle?: Vehicle
  action?: ReactNode
}) {
  return (
    <li className={`reminder reminder-${reminder.status}`}>
      <span className="reminder-icon" aria-hidden>
        {reminder.source === 'insurance' ? '🛡' : '🔧'}
      </span>
      <div className="reminder-main">
        <strong>{reminder.title}</strong>
        <span className="muted">
          {vehicle && (
            <>
              <Link to={`/vehicles/${vehicle.id}`}>{vehicle.nickname}</Link> ·{' '}
            </>
          )}
          {dueText(reminder)}
        </span>
      </div>
      <StatusBadge status={reminder.status} />
      {action}
    </li>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])

  return (
    <dialog ref={ref} className="modal" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="modal-body">
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function FormActions({
  onCancel,
  submitLabel = 'Save',
  extra,
}: {
  onCancel: () => void
  submitLabel?: string
  extra?: ReactNode
}) {
  return (
    <div className="form-actions">
      {extra}
      <span className="spacer" />
      <button type="button" className="btn" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </div>
  )
}

/** Reads a form into a plain string map – keeps the prototype forms uncontrolled and short. */
export function formValues(e: FormEvent<HTMLFormElement>): Record<string, string> {
  e.preventDefault()
  const out: Record<string, string> = {}
  new FormData(e.currentTarget).forEach((v, k) => (out[k] = String(v).trim()))
  return out
}

export const num = (s: string | undefined) => (s === undefined || s === '' ? undefined : Number(s))
