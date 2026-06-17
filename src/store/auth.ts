import { create } from 'zustand'
import type { User } from '@/api/types'
import { getToken, setToken, removeToken } from '@/api/client'
import { login as apiLogin, register as apiRegister, me as apiMe } from '@/api/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, role: 'user' | 'admin') => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  isAuthenticated: !!getToken(),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const { token, user } = await apiLogin({ username, password })
      setToken(token)
      set({ user, token, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (username: string, password: string, role: 'user' | 'admin') => {
    set({ isLoading: true })
    try {
      const { token, user } = await apiRegister({ username, password, role })
      setToken(token)
      set({ user, token, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    removeToken()
    set({ user: null, token: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    const token = getToken()
    if (!token) {
      return
    }
    set({ isLoading: true })
    try {
      const user = await apiMe()
      set({ user, isLoading: false })
    } catch (error) {
      removeToken()
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
