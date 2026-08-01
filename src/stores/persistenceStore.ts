import { create } from 'zustand'

export type PersistenceStatus = 'idle' | 'checking' | 'ready' | 'failed'

interface PersistenceState {
  status: PersistenceStatus
  reason: string | null
  setStatus: (status: PersistenceStatus, reason?: string | null) => void
  reset: () => void
}

export const usePersistenceStore = create<PersistenceState>()((set) => ({
  status: 'idle',
  reason: null,
  setStatus: (status, reason = null) => set({ status, reason }),
  reset: () => set({ status: 'idle', reason: null }),
}))