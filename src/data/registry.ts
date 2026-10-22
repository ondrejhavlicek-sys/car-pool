import type { FuelType } from '../domain/types'

/** Technical data we hope to get from the Czech vehicle registry (dataovozidlech.cz). */
export interface RegistryVehicle {
  make: string
  model: string
  year: number
  plate: string
  vin: string
  fuel: FuelType
  engineKw?: number
  color?: string
}

/**
 * Lookup boundary. No public per-vehicle API for dataovozidlech.cz has been
 * confirmed yet (see PLAN.md), so the prototype fakes it. A real implementation
 * will live behind a Supabase Edge Function so credentials never reach the browser.
 */
export interface VehicleRegistry {
  lookup(query: { plate?: string; vin?: string }): Promise<RegistryVehicle | null>
}

const FAKE_DB: RegistryVehicle[] = [
  { make: 'Škoda', model: 'Octavia Combi', year: 2019, plate: '4AB 1234', vin: 'TMBJJ7NE5K0123456', fuel: 'diesel', engineKw: 85, color: 'Grey' },
  { make: 'Škoda', model: 'Fabia', year: 2014, plate: '1BC 5678', vin: 'TMBEA6NJ4E0654321', fuel: 'petrol', engineKw: 55, color: 'White' },
  { make: 'Volkswagen', model: 'Golf VII', year: 2017, plate: '2AC 9900', vin: 'WVWZZZAUZHW123456', fuel: 'petrol', engineKw: 92, color: 'Blue' },
  { make: 'Toyota', model: 'Yaris Hybrid', year: 2022, plate: '5E4 7788', vin: 'VNKKBAB3300123456', fuel: 'hybrid', engineKw: 85, color: 'Silver' },
]

const norm = (s?: string) => (s ?? '').replace(/\s+/g, '').toUpperCase()

export class MockRegistry implements VehicleRegistry {
  async lookup({ plate, vin }: { plate?: string; vin?: string }) {
    await new Promise((r) => setTimeout(r, 700)) // feel the network
    const p = norm(plate)
    const v = norm(vin)
    if (!p && !v) return null
    return FAKE_DB.find((c) => (p && norm(c.plate) === p) || (v && norm(c.vin) === v)) ?? null
  }
}

export const registry: VehicleRegistry = new MockRegistry()
