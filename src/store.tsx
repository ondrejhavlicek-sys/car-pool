import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocalRepository, type Repository } from './data/repository'
import { buildReminders, type Reminder } from './domain/reminders'
import type { Db, RowOf, TableName } from './domain/types'

interface Store {
  db: Db
  reminders: Reminder[]
  save<T extends TableName>(table: T, row: RowOf<T>): Promise<void>
  remove(table: TableName, id: string): Promise<void>
  resetDemoData(): Promise<void>
}

const Ctx = createContext<Store | null>(null)

export const newId = () => crypto.randomUUID()

export function StoreProvider({ children, repo }: { children: ReactNode; repo?: Repository }) {
  const [repository] = useState<Repository>(() => repo ?? new LocalRepository())
  const [db, setDb] = useState<Db | null>(null)

  const refresh = useCallback(async () => setDb(await repository.load()), [repository])
  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<Store | null>(() => {
    if (!db) return null
    return {
      db,
      reminders: buildReminders(db),
      save: async (table, row) => {
        await repository.save(table, row)
        await refresh()
      },
      remove: async (table, id) => {
        await repository.remove(table, id)
        await refresh()
      },
      resetDemoData: async () => setDb(await repository.reset()),
    }
  }, [db, repository, refresh])

  if (!value) return <p className="loading">Loading…</p>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside <StoreProvider>')
  return s
}

