import { ReactNode, useEffect, useState, useMemo, useCallback } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { useGuardData } from './GuardProvider'
import { useGuardsExecutor } from './hooks/useGuardsExecutor'
import { callbackStorage, createFullUrl, isAuthPage } from './utils'
import { AUTH_CONSTANTS } from './constants'
import type { GuardConfig, GuardsExecutionResult, GuardContext } from './types'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode

  // Guards система
  guards?: GuardConfig[]
  globalTimeout?: number
  onGuardsComplete?: (result: GuardsExecutionResult) => void

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
  globalTimeout = AUTH_CONSTANTS.DEFAULT_GUARD_TIMEOUT,
  onGuardsComplete,
  requireAuth = true,
  onAccessDenied
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, config } = useAuth()
  const { guardData } = useGuardData()
  const location = useLocation()
  const params = useParams()

  // Используем хук для выполнения guards
  const { execute: executeGuards, isExecuting, currentGuard } = useGuardsExecutor(globalTimeout)

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
    return `${pathname}-${search}-${isAuthenticated}-${JSON.stringify(guards.map(g => g.id))}`
  }, [pathname, search, isAuthenticated, hasGuards, guards])

  // Создаем контекст для guards
  const guardContext = useMemo((): GuardContext => ({
    user,
    isAuthenticated,
    route: {
      pathname,
      params,
      search,
      state: location.state
    },
    data: guardData
  }), [user, isAuthenticated, pathname, params, search, location.state, guardData])

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

      if (!result.allowed && onAccessDenied && result.failedGuards.length > 0) {
        onAccessDenied(result.failedGuards[0].reason)
      }
    } catch (error) {
      console.error('Guards execution failed:', error)
      setGuardsResult({
        allowed: false,
        failedGuards: [{
          id: 'system',
          reason: 'Системная ошибка проверки доступа',
          config: {} as GuardConfig
        }],
        executedGuards: [],
        skippedGuards: [],
        executionTime: 0
      })
      setLastExecutionKey(executionKey)
    }
  }, [hasGuards, executeGuards, guards, guardContext, onGuardsComplete, onAccessDenied, executionKey])

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
  }, [
    isLoading,
    requireAuth,
    isAuthenticated,
    runGuards,
    executionKey,
    lastExecutionKey,
    pathname,
    search,
    authPages
  ])

  // Показываем лоадер
  if (isLoading || isExecuting) {
    const message = isLoading
      ? AUTH_CONSTANTS.MESSAGES.CHECKING_AUTH
      : `${AUTH_CONSTANTS.MESSAGES.CHECKING_ACCESS}${currentGuard ? ': ' + currentGuard : ''}`

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

      // Редирект на кастомную страницу
      if (guardConfig.accessDeniedPage) {
        return (
          <Navigate
            to={guardConfig.accessDeniedPage}
            state={{
              reason: firstFailedGuard.reason,
              guardId: firstFailedGuard.id,
              metadata: firstFailedGuard.metadata
            }}
            replace
          />
        )
      }

      // Показ кастомного компонента
      if (guardConfig.accessDeniedComponent) {
        return <>{guardConfig.accessDeniedComponent}</>
      }
    }

    // Глобальный редирект
    if (config.redirects.onAccessDenied) {
      return (
        <Navigate
          to={config.redirects.onAccessDenied}
          state={{
            reason: firstFailedGuard?.reason || 'Доступ запрещен',
            failedGuards: guardsResult.failedGuards
          }}
          replace
        />
      )
    }

    // Дефолтный компонент
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {AUTH_CONSTANTS.MESSAGES.ACCESS_DENIED}
          </h2>
          <p className="text-gray-600 mb-6">
            {firstFailedGuard?.reason || 'У вас недостаточно прав для просмотра этой страницы'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Назад
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
