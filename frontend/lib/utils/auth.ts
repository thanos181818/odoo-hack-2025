// Authentication utilities
import type { User } from "../types"

const AUTH_STORAGE_KEY = "stockmaster_auth"

export function saveAuth(user: User, token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }))
  }
}

export function getAuth(): { user: User; token: string } | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  }
  return null
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export function isAuthenticated(): boolean {
  return getAuth() !== null
}
