import { ReactNode, useEffect, useState, useMemo, useCallback } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { useGuardData } from './GuardProvider'
import { callbackStorage, createFullUrl, isAuthPage } from './utils'
import { AUTH_CONSTANTS } from './constants'
import type { GuardConfig, GuardsExecutionResult, GuardContext } from './types'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode

  // Новая guards система
  guards?: GuardConfig[]
  globalTimeout?: number
  onGuardsComplete?: (result: GuardsExecutionResult) => void

  // Обратная совместимость
  requireAuth?: boolean
  onAccessDenied?: (reason: string) => void
}

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

  const [guardsState, setGuardsState] = useState<{
    isChecking: boolean
    result: GuardsExecutionResult | null
    currentGuard?: string
    lastExecutionKey?: string // Добавляем ключ для предотвращения повторных запусков
  }>({
    isChecking: false,
    result: null
  })

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

  // Функция выполнения guards - мемоизированная
  const executeGuards = useCallback(async () => {
    if (!hasGuards || !guardContext) {
      setGuardsState(prev => ({
        ...prev,
        isChecking: false,
        result: null,
        lastExecutionKey: executionKey
      }))
      return
    }

    const startTime = Date.now()
    setGuardsState(prev => ({
      ...prev,
      isChecking: true,
      result: null,
      lastExecutionKey: executionKey
    }))

    const result: GuardsExecutionResult = {
      allowed: true,
      failedGuards: [],
      executedGuards: [],
      skippedGuards: [],
      executionTime: 0
    }

    try {
      // Сортируем guards по приоритету
      const sortedGuards = [...guards].sort((a, b) => (a.priority || 0) - (b.priority || 0))

      // Разделяем на обязательные и опциональные
      const requiredGuards = sortedGuards.filter(g => g.required !== false)
      const optionalGuards = sortedGuards.filter(g => g.required === false)

      // Выполняем обязательные guards
      for (const guardConfig of requiredGuards) {
        setGuardsState(prev => ({ ...prev, currentGuard: guardConfig.id }))

        if (guardConfig.skipIf && guardConfig.skipIf(guardContext)) {
          result.skippedGuards.push(guardConfig.id)
          continue
        }

        try {
          const guardResult = await Promise.race([
            guardConfig.guard(guardContext),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Guard timeout')),
                guardConfig.timeout || globalTimeout)
            )
          ])

          result.executedGuards.push(guardConfig.id)

          if (!guardResult.allowed) {
            result.allowed = false
            result.failedGuards.push({
              id: guardConfig.id,
              reason: guardResult.reason || 'Доступ запрещен',
              config: guardConfig,
              metadata: guardResult.metadata
            })

            if (guardConfig.onAccessDenied) {
              guardConfig.onAccessDenied(guardResult.reason || 'Доступ запрещен', guardResult.metadata)
            }

            break
          }
        } catch (error) {
          console.error(`Guard "${guardConfig.id}" failed:`, error)
          result.allowed = false
          result.failedGuards.push({
            id: guardConfig.id,
            reason: error instanceof Error ? error.message : 'Ошибка выполнения guard',
            config: guardConfig
          })
          break
        }
      }

      // Если обязательные прошли и есть опциональные - нужен хотя бы один успешный
      if (result.allowed && optionalGuards.length > 0) {
        let anyOptionalPassed = false

        for (const guardConfig of optionalGuards) {
          setGuardsState(prev => ({ ...prev, currentGuard: guardConfig.id }))

          if (guardConfig.skipIf && guardConfig.skipIf(guardContext)) {
            result.skippedGuards.push(guardConfig.id)
            continue
          }

          try {
            const guardResult = await Promise.race([
              guardConfig.guard(guardContext),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Guard timeout')),
                  guardConfig.timeout || globalTimeout)
              )
            ])

            result.executedGuards.push(guardConfig.id)

            if (guardResult.allowed) {
              anyOptionalPassed = true
              break
            } else {
              result.failedGuards.push({
                id: guardConfig.id,
                reason: guardResult.reason || 'Доступ запрещен',
                config: guardConfig,
                metadata: guardResult.metadata
              })
            }
          } catch (error) {
            console.error(`Optional guard "${guardConfig.id}" failed:`, error)
          }
        }

        if (!anyOptionalPassed && optionalGuards.length > 0) {
          result.allowed = false
        }
      }

      result.executionTime = Date.now() - startTime
      setGuardsState({
        isChecking: false,
        result,
        currentGuard: undefined,
        lastExecutionKey: executionKey
      })

      if (onGuardsComplete) {
        onGuardsComplete(result)
      }

      if (!result.allowed && onAccessDenied && result.failedGuards.length > 0) {
        onAccessDenied(result.failedGuards[0].reason)
      }

    } catch (error) {
      console.error('Guards execution failed:', error)
      setGuardsState({
        isChecking: false,
        result: {
          allowed: false,
          failedGuards: [{
            id: 'system',
            reason: 'Системная ошибка проверки доступа',
            config: {} as GuardConfig
          }],
          executedGuards: [],
          skippedGuards: [],
          executionTime: Date.now() - startTime
        },
        lastExecutionKey: executionKey
      })
    }
  }, [guardContext, guards, hasGuards, globalTimeout, onGuardsComplete, onAccessDenied, executionKey])

  // Основной useEffect с правильными зависимостями
  useEffect(() => {
    // Если загружается - ничего не делаем
    if (isLoading) return

    // Если ключ выполнения не изменился - не запускаем повторно
    if (guardsState.lastExecutionKey === executionKey) return

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
    executeGuards()
  }, [
    isLoading,
    requireAuth,
    isAuthenticated,
    executeGuards,
    executionKey,
    guardsState.lastExecutionKey,
    pathname,
    search,
    authPages
  ])

  // Показываем лоадер
  if (isLoading || guardsState.isChecking) {
    const message = isLoading
      ? AUTH_CONSTANTS.MESSAGES.CHECKING_AUTH
      : `${AUTH_CONSTANTS.MESSAGES.CHECKING_ACCESS}${guardsState.currentGuard ? ': ' + guardsState.currentGuard : ''}`

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
  if (guardsState.result && !guardsState.result.allowed) {
    const firstFailedGuard = guardsState.result.failedGuards[0]

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
            failedGuards: guardsState.result.failedGuards
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
