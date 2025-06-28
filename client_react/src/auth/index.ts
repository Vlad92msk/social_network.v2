// Основные компоненты
export { AuthProvider, useAuth } from './AuthProvider'
export { GuardProvider, useGuardData } from './GuardProvider'
export { ProtectedRoute } from './ProtectedRoute'

// Хуки
export { useAutoSignOut, usePermissions, useRole, useSessionTimer } from './hooks/useAuth'
export { useAuthActions } from './hooks/useAuthActions.ts'
export { useGuards } from './hooks/useGuards'

// Основные типы
export type {
  AuthConfig,
  AuthMethods,
  AuthProviderInterface,
  AuthProvider as AuthProviderType,
  AuthRedirects,
  AuthResult,
  AuthState,
  ExternalProvider,
  FirebaseProvider,
  User,
} from './types'

// Типы guards
export type { Guard, GuardConfig, GuardContext, GuardResult, GuardsExecutionResult } from './types/guards'

// Guards
export { authGuard, createAuthGuardConfig, createGuardConfig, ownerGuard, permissionGuard, roleGuard } from './guards'

// Утилиты
export { callbackStorage, createFullUrl, determineRedirectUrl, guardDataStorage, isAuthPage } from './utils'

// Константы
export { AUTH_CONSTANTS } from './constants'

// Конфигурация (опционально)
export { firebaseApp, firebaseAuth, validateFirebaseConfig } from './config'
