import type { Guard, GuardConfig } from '../types'

// Базовый guard для авторизации
export const authGuard: Guard = ({ isAuthenticated }) => ({
  allowed: isAuthenticated,
  reason: isAuthenticated ? undefined : 'Требуется авторизация'
})

// Guard для проверки роли
export const roleGuard = (requiredRole: string): Guard =>
  ({ user }) => {
    const hasRole = user?.roles?.includes(requiredRole) ?? false
    return {
      allowed: hasRole,
      reason: hasRole ? undefined : `Требуется роль: ${requiredRole}`,
      metadata: { requiredRole, userRoles: user?.roles }
    }
  }

// Guard для проверки прав
export const permissionGuard = (requiredPermission: string): Guard =>
  ({ user }) => {
    const hasPermission = user?.permissions?.includes(requiredPermission) ?? false
    return {
      allowed: hasPermission,
      reason: hasPermission ? undefined : `Требуется право: ${requiredPermission}`,
      metadata: { requiredPermission, userPermissions: user?.permissions }
    }
  }

// Guard для проверки владельца - ИСПРАВЛЯЕМ РАБОТУ С PARAMS
export const ownerGuard = (resourceUserId?: string): Guard =>
  ({ user, route }) => {
    // Исправляем получение параметров с учетом возможного undefined
    const targetUserId = resourceUserId ||
      route.params.userId ||
      route.params.id ||
      (route.params['*'] as string) // fallback для динамических роутов

    const isOwner = user?.id === targetUserId

    return {
      allowed: isOwner,
      reason: isOwner ? undefined : 'Доступ только для владельца',
      metadata: { targetUserId, currentUserId: user?.id }
    }
  }

// Пример более безопасного guard для работы с параметрами
export const resourceOwnerGuard = (paramName: string = 'userId'): Guard =>
  ({ user, route }) => {
    const targetUserId = route.params[paramName]

    // Проверяем что параметр существует
    if (!targetUserId) {
      return {
        allowed: false,
        reason: `Параметр ${paramName} не найден в URL`,
        metadata: { paramName, availableParams: Object.keys(route.params) }
      }
    }

    const isOwner = user?.id === targetUserId

    return {
      allowed: isOwner,
      reason: isOwner ? undefined : 'Доступ только для владельца ресурса',
      metadata: { targetUserId, currentUserId: user?.id, paramName }
    }
  }

// Фабрики для создания guard configs
export const createGuardConfig = (
  id: string,
  guard: Guard,
  options: Partial<Omit<GuardConfig, 'id' | 'guard'>> = {}
): GuardConfig => ({
  id,
  guard,
  required: true,
  priority: 0,
  ...options
})

export const createAuthGuardConfig = (options: Partial<GuardConfig> = {}): GuardConfig =>
  createGuardConfig('auth', authGuard, {
    description: 'Базовая проверка авторизации',
    priority: -1000,
    accessDeniedPage: '/signin',
    ...options
  })

export const createRoleGuardConfig = (
  role: string,
  options: Partial<GuardConfig> = {}
): GuardConfig =>
  createGuardConfig(`role_${role}`, roleGuard(role), {
    description: `Проверка роли: ${role}`,
    ...options
  })

export const createOwnerGuardConfig = (
  resourceUserId?: string,
  options: Partial<GuardConfig> = {}
): GuardConfig =>
  createGuardConfig('owner', ownerGuard(resourceUserId), {
    description: 'Проверка владельца ресурса',
    required: false, // Обычно используется с OR логикой
    ...options
  })
