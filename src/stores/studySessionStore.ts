import { create } from 'zustand'

export type StudySessionStatus = 'active' | 'paused' | 'finished' | 'cancelled'

export interface StudySession {
  id: string
  topicId: string
  phaseId: string
  startTime: number
  endTime: number | null
  durationMinutes: number
  status: StudySessionStatus
  completed: boolean
  notes: string
  createdAt: number
  updatedAt: number
  elapsedSeconds: number
  /** Optional planned session length in minutes (in-memory UI goal only). */
  goalMinutes?: number
}

interface StudySessionState {
  sessions: Record<string, StudySession>
  activeSessionId: string | null
  startSession: (topicId: string, phaseId: string, goalMinutes?: number) => string
  pauseSession: () => void
  resumeSession: () => void
  finishSession: (completed?: boolean) => StudySession | null
  cancelSession: () => void
  updateNotes: (notes: string) => void
  getActiveSession: () => StudySession | null
  getElapsedSeconds: () => number
  _hydrate: (slice: Partial<Pick<StudySessionState, 'sessions'>>) => void
}

function createSession(topicId: string, phaseId: string, goalMinutes?: number): StudySession {
  const now = Date.now()
  return {
    id: `study-${now}-${Math.random().toString(36).slice(2, 8)}`,
    topicId,
    phaseId,
    startTime: now,
    endTime: null,
    durationMinutes: 0,
    status: 'active',
    completed: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
    elapsedSeconds: 0,
    ...(goalMinutes !== undefined ? { goalMinutes } : {}),
  }
}

function getCurrentElapsedSeconds(session: StudySession | null): number {
  if (!session) return 0
  if (session.status === 'active') {
    return session.elapsedSeconds + Math.max(0, Math.floor((Date.now() - session.startTime) / 1000))
  }
  return session.elapsedSeconds
}

export const useStudySessionStore = create<StudySessionState>()((set, get) => ({
  sessions: {},
  activeSessionId: null,

  startSession: (topicId, phaseId, goalMinutes) => {
    const existing = get().getActiveSession()
    if (existing && (existing.status === 'active' || existing.status === 'paused')) {
      return existing.id
    }

    const session = createSession(topicId, phaseId, goalMinutes)
    set((state) => ({
      sessions: { ...state.sessions, [session.id]: session },
      activeSessionId: session.id,
    }))
    return session.id
  },

  pauseSession: () => {
    const session = get().getActiveSession()
    if (!session || session.status !== 'active') return

    const now = Date.now()
    const elapsedSeconds = session.elapsedSeconds + Math.max(0, Math.floor((now - session.startTime) / 1000))
    set((state) => ({
      sessions: {
        ...state.sessions,
        [session.id]: {
          ...session,
          status: 'paused',
          elapsedSeconds,
          updatedAt: now,
        },
      },
    }))
  },

  resumeSession: () => {
    const session = get().getActiveSession()
    if (!session || session.status !== 'paused') return

    const now = Date.now()
    set((state) => ({
      sessions: {
        ...state.sessions,
        [session.id]: {
          ...session,
          status: 'active',
          startTime: now,
          updatedAt: now,
        },
      },
    }))
  },

  finishSession: (completed = true) => {
    const session = get().getActiveSession()
    if (!session) return null

    const now = Date.now()
    const currentElapsed = getCurrentElapsedSeconds(session)
    const durationMinutes = Math.max(1, Math.round(currentElapsed / 60))
    const finished: StudySession = {
      ...session,
      status: completed ? 'finished' : 'cancelled',
      completed,
      endTime: now,
      durationMinutes,
      elapsedSeconds: currentElapsed,
      updatedAt: now,
    }

    set((state) => ({
      sessions: { ...state.sessions, [session.id]: finished },
      activeSessionId: null,
    }))
    return finished
  },

  cancelSession: () => {
    get().finishSession(false)
  },

  updateNotes: (notes) => {
    const session = get().getActiveSession()
    if (!session) return

    const now = Date.now()
    set((state) => ({
      sessions: {
        ...state.sessions,
        [session.id]: {
          ...session,
          notes,
          updatedAt: now,
        },
      },
    }))
  },

  getActiveSession: () => {
    const { activeSessionId, sessions } = get()
    if (!activeSessionId) return null
    return sessions[activeSessionId] ?? null
  },

  getElapsedSeconds: () => getCurrentElapsedSeconds(get().getActiveSession()),

  _hydrate: (slice) =>
    set((state) => {
      if (!slice.sessions) {
        return state
      }

      const activeSession =
        Object.values(slice.sessions)
          .filter((session) => session.status === 'active' || session.status === 'paused')
          .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null

      return {
        ...state,
        sessions: slice.sessions,
        activeSessionId: activeSession?.id ?? null,
      }
    }),
}))