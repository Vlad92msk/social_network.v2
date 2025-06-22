import { AuthConfig } from '../types'
import { AUTH_CONSTANTS } from '../constants'

const defaultConfig: AuthConfig = {
  redirects: {
    afterSignIn: '/',
    afterSignOut: '/signin',
    whenUnauthenticated: '/signin'
  },
  autoRedirect: true,
  providers: ['google', 'email'],
  authPages: [...AUTH_CONSTANTS.DEFAULT_AUTH_PAGES],
  sessionTimeout: AUTH_CONSTANTS.DEFAULT_SESSION_TIMEOUT,
  guards: {
    enabled: false,
    globalTimeout: AUTH_CONSTANTS.DEFAULT_GUARD_TIMEOUT,
    fallback: 'component'
  }
}

/**
 * Безопасное слияние конфигураций авторизации
 */
export function mergeAuthConfig(userConfig?: Partial<AuthConfig>): AuthConfig {
  if (!userConfig) return { ...defaultConfig }

  const merged: AuthConfig = {
    ...defaultConfig,
    ...userConfig,
    redirects: {
      ...defaultConfig.redirects,
      ...userConfig.redirects
    },
    authPages: userConfig.authPages || [...AUTH_CONSTANTS.DEFAULT_AUTH_PAGES]
  }

  // Безопасное слияние guards конфигурации
  if (userConfig.guards) {
    merged.guards = {
      enabled: userConfig.guards.enabled ?? defaultConfig.guards.enabled,
      globalTimeout: userConfig.guards.globalTimeout ?? defaultConfig.guards.globalTimeout,
      fallback: userConfig.guards.fallback ?? defaultConfig.guards.fallback,
      fallbackComponent: userConfig.guards.fallbackComponent
    }
  }

  return merged
}
