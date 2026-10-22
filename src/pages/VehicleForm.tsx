import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { registry } from '../data/registry'
import { FUEL_LABEL, type FuelType, type Vehicle } from '../domain/types'
import { Field, FormActions, num } from '../ui/components'
import { newId, useStore } from '../store'

type Draft = Omit<Vehicle, 'id' | 'odometerKm' | 'year' | 'engineKw'> & {
  year: string
  engineKw: string
  odometerKm: string
}

const BLANK: Draft = {
  nickname: '',
  make: '',
  model: '',
  year: '',
  plate: '',
  vin: '',
  fuel: 'petrol',
  engineKw: '',
  color: '',
  odometerKm: '',
  notes: '',
  source: 'manual',
}

function toDraft(v: Vehicle): Draft {
  return {
    ...v,
    year: String(v.year),
    engineKw: v.engineKw?.toString() ?? '',
    odometerKm: String(v.odometerKm),
    color: v.color ?? '',
    notes: v.notes ?? '',
  }
}

type Lookup = { state: 'idle' } | { state: 'loading' } | { state: 'found' } | { state: 'missing' }

export default function VehicleForm() {
  const { id } = useParams()
  const { db, save, remove } = useStore()
  const navigate = useNavigate()
  const existing = db.vehicles.find((v) => v.id === id)
  const [draft, setDraft] = useState<Draft>(() => (existing ? toDraft(existing) : BLANK))
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' })

  if (id && !existing) return <p>Vehicle not found. <Link to="/vehicles">Back to vehicles</Link></p>

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  async function runLookup() {
    setLookup({ state: 'loading' })
    const hit = await registry.lookup({ plate: draft.plate, vin: draft.vin })
    if (!hit) return setLookup({ state: 'missing' })
    setDraft((d) => ({
      ...d,
      make: hit.make,
      model: hit.model,
      year: String(hit.year),
      plate: hit.plate,
      vin: hit.vin,
      fuel: hit.fuel,
      engineKw: hit.engineKw?.toString() ?? '',
      color: hit.color ?? '',
      nickname: d.nickname || `${hit.make} ${hit.model}`,
      source: 'registry',
    }))
    setLookup({ state: 'found' })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const vehicle: Vehicle = {
      id: existing?.id ?? newId(),
      nickname: draft.nickname || `${draft.make} ${draft.model}`,
      make: draft.make,
      model: draft.model,
      year: num(draft.year) ?? new Date().getFullYear(),
      plate: draft.plate.toUpperCase(),
      vin: draft.vin.toUpperCase(),
      fuel: draft.fuel,
      engineKw: num(draft.engineKw),
      color: draft.color || undefined,
      odometerKm: num(draft.odometerKm) ?? 0,
      notes: draft.notes || undefined,
      source: draft.source,
    }
    await save('vehicles', vehicle)
    navigate(`/vehicles/${vehicle.id}`)
  }

  async function del() {
    if (!existing || !confirm(`Delete ${existing.nickname} and all its insurance and service data?`)) return
    await remove('vehicles', existing.id)
    navigate('/vehicles')
  }

  return (
    <>
      <h1>{existing ? `Edit ${existing.nickname}` : 'Add vehicle'}</h1>

      <form className="form" onSubmit={submit}>
        <fieldset className="panel">
          <legend>Find in the Czech vehicle registry</legend>
          <p className="muted">
            Enter the plate (SPZ) or VIN and we’ll fill in the technical data. Prototype hint: try{' '}
            <code>2AC 9900</code> or <code>5E4 7788</code>.
          </p>
          <div className="row">
            <Field label="SPZ (plate)">
              <input value={draft.plate} onChange={(e) => set('plate', e.target.value)} placeholder="1AB 2345" />
            </Field>
            <Field label="VIN">
              <input value={draft.vin} onChange={(e) => set('vin', e.target.value)} placeholder="17 characters" />
            </Field>
            <button
              type="button"
              className="btn"
              disabled={lookup.state === 'loading' || (!draft.plate && !draft.vin)}
              onClick={runLookup}
            >
              {lookup.state === 'loading' ? 'Looking up…' : 'Look up'}
            </button>
          </div>
          {lookup.state === 'found' && <p className="ok-text">✓ Found in registry – details filled in below.</p>}
          {lookup.state === 'missing' && (
            <p className="warn-text">Nothing found. You can still enter the details manually.</p>
          )}
        </fieldset>

        <div className="row">
          <Field label="Nickname" hint="How you call it, e.g. “Family wagon”">
            <input value={draft.nickname} onChange={(e) => set('nickname', e.target.value)} />
          </Field>
          <Field label="Odometer (km)">
            <input type="number" min={0} required value={draft.odometerKm} onChange={(e) => set('odometerKm', e.target.value)} />
          </Field>
        </div>
        <div className="row">
          <Field label="Make">
            <input required value={draft.make} onChange={(e) => set('make', e.target.value)} />
          </Field>
          <Field label="Model">
            <input required value={draft.model} onChange={(e) => set('model', e.target.value)} />
          </Field>
          <Field label="Year">
            <input type="number" min={1900} max={2100} value={draft.year} onChange={(e) => set('year', e.target.value)} />
          </Field>
        </div>
        <div className="row">
          <Field label="Fuel">
            <select value={draft.fuel} onChange={(e) => set('fuel', e.target.value as FuelType)}>
              {Object.entries(FUEL_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Power (kW)">
            <input type="number" min={0} value={draft.engineKw} onChange={(e) => set('engineKw', e.target.value)} />
          </Field>
          <Field label="Colour">
            <input value={draft.color} onChange={(e) => set('color', e.target.value)} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea rows={3} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        <FormActions
          onCancel={() => navigate(existing ? `/vehicles/${existing.id}` : '/vehicles')}
          submitLabel={existing ? 'Save changes' : 'Add vehicle'}
          extra={
            existing && (
              <button type="button" className="btn btn-danger" onClick={del}>
                Delete vehicle
              </button>
            )
          }
        />
      </form>
    </>
  )
}
