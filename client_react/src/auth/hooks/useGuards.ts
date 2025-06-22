// src/auth/hooks/useGuards.ts

import { useCallback } from 'react'
import { useAuth } from '../AuthProvider'
import { useGuardData } from '../GuardProvider'
import type { GuardConfig } from '../types/guards'
import { authGuard, roleGuard, ownerGuard } from '../guards'

export function useGuards() {
  const { user } = useAuth()
  const { setGuardData } = useGuardData()

  // Быстрые проверки без создания полноценных guards
  const canAccess = useCallback(async (guardConfigs: GuardConfig[]) => {
    // Простая реализация для быстрых проверок
    // В будущем можно расширить
    return true
  }, [])

  // Хелперы для создания популярных guards
  const createAuthGuard = useCallback((): GuardConfig => ({
    id: 'auth',
    guard: authGuard,
    required: true,
    priority: -1000
  }), [])

  const createRoleGuard = useCallback((role: string): GuardConfig => ({
    id: `role_${role}`,
    guard: roleGuard(role),
    required: true
  }), [])

  const createOwnerGuard = useCallback((userId?: string): GuardConfig => ({
    id: 'owner',
    guard: ownerGuard(userId),
    required: false
  }), [])

  return {
    canAccess,
    setGuardData,
    createAuthGuard,
    createRoleGuard,
    createOwnerGuard
  }
}
