import { hydrateFromDb, installPersistence } from './repository'
import { getDbAsync } from './db'
import { usePersistenceStore } from '../stores/persistenceStore'

let uninstall: (() => void) | null = null
let ready = false

export async function bootstrap(): Promise<{ ready: boolean; reason?: string }> {
  if (ready) return { ready }

  usePersistenceStore.getState().setStatus('checking')

  try {
    await getDbAsync()

    const ok = await hydrateFromDb()
    if (!ok) {
      throw new Error('SQLite hydration failed during startup.')
    }

    uninstall = installPersistence()
    ready = true
    usePersistenceStore.getState().setStatus('ready')
    return { ready: true }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown persistence failure.'
    usePersistenceStore.getState().setStatus('failed', reason)
    return { ready: false, reason }
  }
}

export function teardown(): void {
  if (uninstall) {
    uninstall()
    uninstall = null
  }
  ready = false
  usePersistenceStore.getState().reset()
}
