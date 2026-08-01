import { hydrateFromDb, installPersistence } from './repository'
import { isPersistenceReady } from './db'

let uninstall: (() => void) | null = null
let ready = false

export async function bootstrap(): Promise<{ ready: boolean; reason?: string }> {
  if (ready) return { ready }

  if (!isPersistenceReady()) {
    return { ready: false, reason: 'node-runtime-missing' }
  }

  const ok = await hydrateFromDb()
  if (!ok) {
    return { ready: false, reason: 'hydrate-failed' }
  }

  uninstall = installPersistence()
  ready = true
  return { ready: true }
}

export function teardown(): void {
  if (uninstall) {
    uninstall()
    uninstall = null
  }
  ready = false
}
