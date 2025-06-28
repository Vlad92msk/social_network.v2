import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import { useAuth } from './AuthProvider'
import { AUTH_CONSTANTS } from './constants'
import { useGuardData } from './GuardProvider'
import { useGuardsExecutor } from './hooks/useGuardsExecutor'
import type { GuardConfig, GuardContext, GuardsExecutionResult } from './types'
import { callbackStorage, createFullUrl, isAuthPage } from './utils'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode

  // Guards система
  guards?: GuardConfig[]
  globalTimeout?: number
  onGuardsComplete?: (result: GuardsExecutionResult) => void

  // Обработка отказа в доступе (переопределяют глобальные настройки)
  accessDeniedComponent?: ReactNode
  accessDeniedPage?: string

  // Обратная совместимость
  requireAuth?: boolean
  onAccessDenied?: (reason: string) => void
}

/**
 * Компонент защищенного маршрута с поддержкой guards
 */
export function ProtectedRoute({
  children,
  fallback,
  guards = [],
  globalTimeout,
  onGuardsComplete,
  accessDeniedComponent,
  accessDeniedPage,
  requireAuth = true,
  onAccessDenied,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, config } = useAuth()
  const { guardData, globalConfig } = useGuardData()
  const location = useLocation()
  const params = useParams()

  // Используем глобальный таймаут если не указан локальный
  const effectiveTimeout = globalTimeout ?? globalConfig.defaultTimeout ?? AUTH_CONSTANTS.DEFAULT_GUARD_TIMEOUT

  // Используем хук для выполнения guards
  const { execute: executeGuards, isExecuting, currentGuard } = useGuardsExecutor(effectiveTimeout)

  const [guardsResult, setGuardsResult] = useState<GuardsExecutionResult | null>(null)
  const [lastExecutionKey, setLastExecutionKey] = useState<string>('')

  // Стабильные значения для зависимостей
  const pathname = location.pathname
  const search = location.search
  const hasGuards = guards.length > 0
  const authPages = config.authPages || [...AUTH_CONSTANTS.DEFAULT_AUTH_PAGES]

  // Создаем стабильный ключ для выполнения guards
  const executionKey = useMemo(() => {
    if (!hasGuards) return 'no-guards'
    return `${pathname}-${search}-${isAuthenticated}-${JSON.stringify(guards.map((g) => g.id))}`
  }, [pathname, search, isAuthenticated, hasGuards, guards])

  // Создаем контекст для guards
  const guardContext = useMemo(
    (): GuardContext => ({
      user,
      isAuthenticated,
      route: {
        pathname,
        params,
        search,
        state: location.state,
      },
      data: guardData,
    }),
    [user, isAuthenticated, pathname, params, search, location.state, guardData],
  )

  // Функция выполнения guards
  const runGuards = useCallback(async () => {
    if (!hasGuards) {
      setGuardsResult(null)
      setLastExecutionKey(executionKey)
      return
    }

    try {
      const result = await executeGuards(guards, guardContext)
      setGuardsResult(result)
      setLastExecutionKey(executionKey)

      onGuardsComplete?.(result)

      if (!result.allowed && result.failedGuards.length > 0) {
        const firstFailedGuard = result.failedGuards[0]

        // Вызываем локальный обработчик
        onAccessDenied?.(firstFailedGuard.reason)

        // Вызываем глобальный обработчик
        globalConfig.onAccessDenied?.(firstFailedGuard.reason, firstFailedGuard.metadata)
      }
    } catch (error) {
      console.error('Guards execution failed:', error)
      setGuardsResult({
        allowed: false,
        failedGuards: [
          {
            id: 'system',
            reason: 'Системная ошибка проверки доступа',
            config: {} as GuardConfig,
          },
        ],
        executedGuards: [],
        skippedGuards: [],
        executionTime: 0,
      })
      setLastExecutionKey(executionKey)
    }
  }, [hasGuards, executeGuards, guards, guardContext, onGuardsComplete, onAccessDenied, globalConfig, executionKey])

  // Основной useEffect
  useEffect(() => {
    // Если загружается - ничего не делаем
    if (isLoading) return

    // Если ключ выполнения не изменился - не запускаем повторно
    if (lastExecutionKey === executionKey) return

    // Обратная совместимость - базовая проверка авторизации
    if (requireAuth && !isAuthenticated) {
      const currentUrl = createFullUrl(pathname, search)
      const existingCallbackUrl = callbackStorage.get()

      if (!isAuthPage(currentUrl, authPages) && !existingCallbackUrl) {
        callbackStorage.set(currentUrl)
      }
      return
    }

    // Запускаем выполнение guards
    runGuards()
  }, [isLoading, requireAuth, isAuthenticated, runGuards, executionKey, lastExecutionKey, pathname, search, authPages])

  // Показываем лоадер
  if (isLoading || isExecuting) {
    const message = isLoading ? AUTH_CONSTANTS.MESSAGES.CHECKING_AUTH : `${AUTH_CONSTANTS.MESSAGES.CHECKING_ACCESS}${currentGuard ? ': ' + currentGuard : ''}`

    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className={`${AUTH_CONSTANTS.LOADER_SIZE} border-4 ${AUTH_CONSTANTS.LOADER_COLORS} rounded-full animate-spin mb-4`} />
          <p className="text-gray-600">{message}</p>
        </div>
      )
    )
  }

  // Редирект для неавторизованных
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={config.redirects.whenUnauthenticated} replace />
  }

  // Обработка отказа в доступе
  if (guardsResult && !guardsResult.allowed) {
    const firstFailedGuard = guardsResult.failedGuards[0]

    if (firstFailedGuard) {
      const guardConfig = firstFailedGuard.config

      // 1. Кастомный компонент из guard конфигурации (высший приоритет)
      if (guardConfig.accessDeniedComponent) {
        return <>{guardConfig.accessDeniedComponent}</>
      }

      // 2. Редирект на кастомную страницу из guard конфигурации
      if (guardConfig.accessDeniedPage) {
        return (
          <Navigate
            to={guardConfig.accessDeniedPage}
            state={{
              reason: firstFailedGuard.reason,
              guardId: firstFailedGuard.id,
              metadata: firstFailedGuard.metadata,
            }}
            replace
          />
        )
      }
    }

    // 3. Кастомный компонент из пропов ProtectedRoute (переопределяет глобальный)
    if (accessDeniedComponent) {
      return <>{accessDeniedComponent}</>
    }

    // 4. Редирект на кастомную страницу из пропов ProtectedRoute
    if (accessDeniedPage) {
      return (
        <Navigate
          to={accessDeniedPage}
          state={{
            reason: firstFailedGuard?.reason || 'Доступ запрещен',
            failedGuards: guardsResult.failedGuards,
          }}
          replace
        />
      )
    }

    // 5. Глобальный компонент из GuardProvider
    if (globalConfig.accessDeniedComponent) {
      return <>{globalConfig.accessDeniedComponent}</>
    }

    // 6. Глобальная страница из GuardProvider
    if (globalConfig.accessDeniedPage) {
      return (
        <Navigate
          to={globalConfig.accessDeniedPage}
          state={{
            reason: firstFailedGuard?.reason || 'Доступ запрещен',
            failedGuards: guardsResult.failedGuards,
          }}
          replace
        />
      )
    }

    // 7. Глобальный редирект из AuthProvider конфигурации
    if (config.redirects.onAccessDenied) {
      return (
        <Navigate
          to={config.redirects.onAccessDenied}
          state={{
            reason: firstFailedGuard?.reason || 'Доступ запрещен',
            failedGuards: guardsResult.failedGuards,
          }}
          replace
        />
      )
    }

    // 8. Если ничего не настроено - показываем ошибку в консоли и перенаправляем на главную
    console.error('ProtectedRoute: Доступ запрещен, но не настроен ни один способ обработки отказа', {
      reason: firstFailedGuard?.reason,
      availableOptions: [
        'guard.accessDeniedComponent',
        'guard.accessDeniedPage',
        'ProtectedRoute.accessDeniedComponent prop',
        'ProtectedRoute.accessDeniedPage prop',
        'GuardProvider.accessDeniedComponent',
        'GuardProvider.accessDeniedPage',
        'AuthProvider.config.redirects.onAccessDenied',
      ],
    })

    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
