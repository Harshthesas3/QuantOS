import { create } from 'zustand'
import { loadPasswordHash, upsertUser, loadUser } from '../services/repository'
import { hashPassword, verifyPassword } from '../services/auth'

export interface User {
  id: string
  username: string
  email: string
}

interface UserState {
  user: User | null
  hasAccount: boolean
  lastError: string | null
  setUser: (user: User | null) => void
  initializeUser: () => void
  clearUser: () => void
  createAccount: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signIn: (password: string) => Promise<{ ok: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
  signInUsernameOnly: (username: string) => void
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  hasAccount: false,
  lastError: null,

  setUser: (user) => set({ user, lastError: null }),

  initializeUser: () => {
    void (async () => {
      try {
        const u = await loadUser()
        const pw = await loadPasswordHash()
        set({ user: u, hasAccount: !!pw })
      } catch {
        set({ user: null, hasAccount: false })
      }
    })()
  },

  clearUser: () => set({ user: null, lastError: null }),

  createAccount: async (username, password) => {
    if (!username.trim()) return { ok: false, error: 'Username is required.' }
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }

    try {
      const passwordHash = await hashPassword(password)
      const u: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        username: username.trim(),
        email: `${username.trim()}@quantos.local`,
      }
      await upsertUser(u, passwordHash)
      set({ user: u, hasAccount: true, lastError: null })
      return { ok: true }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not create account.'
      set({ lastError: message })
      return { ok: false, error: message }
    }
  },

  signIn: async (password) => {
    try {
      const stored = await loadPasswordHash()
      if (!stored) {
        return { ok: false, error: 'No local account found. Create one first.' }
      }
      const ok = await verifyPassword(stored, password)
      if (!ok) {
        set({ lastError: 'Incorrect password.' })
        return { ok: false, error: 'Incorrect password.' }
      }
      const u = await loadUser()
      if (!u) {
        return { ok: false, error: 'User record missing. Re-create the account.' }
      }
      set({ user: u, lastError: null })
      return { ok: true }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not sign in.'
      set({ lastError: message })
      return { ok: false, error: message }
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
    try {
      const stored = await loadPasswordHash()
      if (!stored) return { ok: false, error: 'No account on file.' }
      const ok = await verifyPassword(stored, currentPassword)
      if (!ok) return { ok: false, error: 'Current password is incorrect.' }
      const newHash = await hashPassword(newPassword)
      const u = get().user ?? (await loadUser())
      if (!u) return { ok: false, error: 'No active user.' }
      await upsertUser(u, newHash)
      return { ok: true }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not change password.'
      return { ok: false, error: message }
    }
  },

  signInUsernameOnly: (username) => {
    const u: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username: username.trim(),
      email: `${username.trim()}@quantos.local`,
    }
    set({ user: u, hasAccount: false, lastError: null })
  },
}))
