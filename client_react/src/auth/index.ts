// Основные компоненты
export { AuthProvider, useAuth } from './AuthProvider'
export { ProtectedRoute } from './ProtectedRoute'
export { GuardProvider, useGuardData } from './GuardProvider'

// Хуки
export { useRole, usePermissions, useSessionTimer, useAutoSignOut } from './hooks/useAuth'
export { useAuthActions } from './hooks/useAuthActions.ts'
export { useGuards } from './hooks/useGuards'

// Основные типы
export type {
  User,
  AuthProvider as AuthProviderType,
  FirebaseProvider,
  ExternalProvider,
  AuthState,
  AuthResult,
  AuthConfig,
  AuthRedirects,
  AuthMethods,
  AuthProviderInterface
} from './types'

// Типы guards
export type {
  Guard,
  GuardConfig,
  GuardContext,
  GuardResult,
  GuardsExecutionResult
} from './types/guards'

// Guards
export {
  authGuard,
  roleGuard,
  permissionGuard,
  ownerGuard,
  createGuardConfig,
  createAuthGuardConfig
} from './guards'

// Утилиты
export {
  callbackStorage,
  guardDataStorage,
  createFullUrl,
  isAuthPage,
  determineRedirectUrl
} from './utils'

// Константы
export { AUTH_CONSTANTS } from './constants'

// Конфигурация (опционально)
export { firebaseAuth, firebaseApp, validateFirebaseConfig } from './config'
