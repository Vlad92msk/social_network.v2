import { ReactNode } from 'react'

import { User } from '.'

export interface GuardContext {
  user: User | null
  isAuthenticated: boolean
  route: {
    pathname: string
    params: Record<string, string | undefined> // Исправляем тип
    search: string
    state?: any
  }
  data?: Record<string, any>
}

export interface GuardResult {
  allowed: boolean
  reason?: string
  metadata?: Record<string, any>
}

export type Guard = (context: GuardContext) => GuardResult | Promise<GuardResult>

export interface GuardConfig {
  id: string
  guard: Guard
  required?: boolean
  priority?: number

  // Обработка отказа в доступе
  onAccessDenied?: (reason: string, metadata?: Record<string, any>) => void
  accessDeniedPage?: string
  accessDeniedComponent?: ReactNode

  // Дополнительные опции
  skipIf?: (context: GuardContext) => boolean
  retryable?: boolean
  timeout?: number

  // Мета-информация
  description?: string
  group?: string
}

export interface GuardsExecutionResult {
  allowed: boolean
  failedGuards: Array<{
    id: string
    reason: string
    config: GuardConfig
    metadata?: Record<string, any>
  }>
  executedGuards: string[]
  skippedGuards: string[]
  executionTime: number
}
