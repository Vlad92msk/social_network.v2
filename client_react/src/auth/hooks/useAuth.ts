// src/auth/hooks/useAuth.ts
import { useEffect, useState } from 'react'

import { useAuth as useAuthContext } from '../AuthProvider'

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
}

export function useRole(requiredRole?: string) {
  const { user } = useAuthContext()

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false
  }

  return {
    hasRole,
    hasRequiredRole: requiredRole ? hasRole(requiredRole) : true,
    userRoles: user?.roles || [],
  }
}

export function usePermissions(requiredPermissions: string[] = []) {
  const { user } = useAuthContext()

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false
  }

  const hasAllPermissions = requiredPermissions.every(hasPermission)
  const hasSomePermissions = requiredPermissions.some(hasPermission)

  return {
    hasPermission,
    hasAllPermissions,
    hasSomePermissions,
    userPermissions: user?.permissions || [],
  }
}

export function useSessionTimer() {
  const { isAuthenticated } = useAuthContext()
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)

  useEffect(() => {
    if (isAuthenticated && !sessionStart) {
      setSessionStart(new Date())
    } else if (!isAuthenticated) {
      setSessionStart(null)
      setSessionDuration(0)
    }
  }, [isAuthenticated, sessionStart])

  useEffect(() => {
    if (!sessionStart) return

    const interval = setInterval(() => {
      setSessionDuration(Date.now() - sessionStart.getTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStart])

  return {
    sessionStart,
    sessionDuration,
    sessionDurationFormatted: formatDuration(sessionDuration),
  }
}

export function useAutoSignOut(timeoutMinutes: number = 30) {
  const { signOut, isAuthenticated } = useAuthContext()
  const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60)

  useEffect(() => {
    if (!isAuthenticated) {
      setTimeLeft(timeoutMinutes * 60)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          signOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, timeoutMinutes, signOut])

  const resetTimer = () => {
    setTimeLeft(timeoutMinutes * 60)
  }

  return {
    timeLeft,
    timeLeftFormatted: formatDuration(timeLeft * 1000),
    resetTimer,
  }
}
