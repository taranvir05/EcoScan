import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginUser } from '@/services/api'

const TOKEN_STORAGE_KEY = 'ecoscan_token'
const SESSION_STORAGE_KEY = 'ecoscan_session'

type AuthSession = {
  email?: string
  userId?: string
  role?: string
}

type AuthContextValue = {
  token: string | null
  session: AuthSession | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function parseJwtToken(token: string): AuthSession {
  try {
    const base64Payload = token.split('.')[1]
    const payload = JSON.parse(atob(base64Payload))
    return {
      userId: payload.id,
      role: payload.role,
    }
  } catch {
    return {}
  }
}

function readStoredSession(): AuthSession | null {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!rawSession) return null

  try {
    return JSON.parse(rawSession) as AuthSession
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())

  const login = async (email: string, password: string) => {
    const response = await loginUser({ email, password })
    const nextToken = response?.token

    if (!nextToken) {
      throw new Error('Authentication token not received')
    }

    const jwtSession = parseJwtToken(nextToken)
    const nextSession: AuthSession = {
      ...jwtSession,
      email,
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))

    setToken(nextToken)
    setSession(nextSession)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setToken(null)
    setSession(null)
  }

  const value = useMemo(
    () => ({
      token,
      session,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [session, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
