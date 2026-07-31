import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  email: string
  // Add other user properties as needed
}

interface UserState {
  user: User | null
  setUser: (user: User | null) => void
  initializeUser: () => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      initializeUser: () => {
        // In a real app, this would check for existing session or token
        // For now, we'll set a demo user or leave as null
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          set({ user: JSON.parse(storedUser) })
        }
      },
      clearUser: () => {
        set({ user: null })
        localStorage.removeItem('user')
      },
    }),
    {
      name: 'user-storage', // name of the item in localStorage (or sessionStorage)
    }
  )
)