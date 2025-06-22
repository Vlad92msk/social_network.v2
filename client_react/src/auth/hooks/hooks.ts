// src/auth/hooks/hooks.ts
import { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider.tsx'

/**
 * Хук для проверки конкретной роли пользователя
 */
export function useRole(requiredRole?: string) {
  const { user, isAuthenticated } = useAuth()

  const hasRole = (role: string): boolean => {
    // Расширьте логику в зависимости от вашей системы ролей
    // Например, если роли хранятся в user.roles[]
    return (user as any)?.roles?.includes(role) || false
  }

  return {
    hasRole,
    hasRequiredRole: requiredRole ? hasRole(requiredRole) : true,
    userRoles: (user as any)?.roles || []
  }
}

/**
 * Хук для проверки конкретных прав доступа
 */
export function usePermissions(requiredPermissions: string[] = []) {
  const { user, isAuthenticated } = useAuth()

  const hasPermission = (permission: string): boolean => {
    // Расширьте логику в зависимости от вашей системы прав
    return (user as any)?.permissions?.includes(permission) || false
  }

  const hasAllPermissions = requiredPermissions.every(hasPermission)
  const hasSomePermissions = requiredPermissions.some(hasPermission)

  return {
    hasPermission,
    hasAllPermissions,
    hasSomePermissions,
    userPermissions: (user as any)?.permissions || []
  }
}

/**
 * Хук для отслеживания времени сессии
 */
export function useSessionTimer() {
  const { isAuthenticated } = useAuth()
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
    sessionDurationFormatted: formatDuration(sessionDuration)
  }
}

/**
 * Хук для автоматического выхода по таймауту
 */
export function useAutoSignOut(timeoutMinutes: number = 30) {
  const { signOut, isAuthenticated } = useAuth()
  const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60)

  useEffect(() => {
    if (!isAuthenticated) {
      setTimeLeft(timeoutMinutes * 60)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
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
    resetTimer
  }
}

/**
 * Утилита для форматирования времени
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
}
