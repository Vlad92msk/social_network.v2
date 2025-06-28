import { GuardConfig, GuardContext, GuardsExecutionResult } from '../types'

/**
 * Класс для выполнения guards с поддержкой middleware
 */
export class GuardsExecutor {
  private globalTimeout: number

  constructor(globalTimeout: number = 5000) {
    this.globalTimeout = globalTimeout
  }

  /**
   * Выполняет набор guards и возвращает результат
   */
  async execute(guards: GuardConfig[], context: GuardContext, onProgress?: (guardId: string) => void): Promise<GuardsExecutionResult> {
    const startTime = Date.now()

    const result: GuardsExecutionResult = {
      allowed: true,
      failedGuards: [],
      executedGuards: [],
      skippedGuards: [],
      executionTime: 0,
    }

    if (guards.length === 0) {
      result.executionTime = Date.now() - startTime
      return result
    }

    try {
      // Сортируем guards по приоритету
      const sortedGuards = [...guards].sort((a, b) => (a.priority || 0) - (b.priority || 0))

      // Разделяем на обязательные и опциональные
      const requiredGuards = sortedGuards.filter((g) => g.required !== false)
      const optionalGuards = sortedGuards.filter((g) => g.required === false)

      // Выполняем обязательные guards
      const requiredPassed = await this.executeGuardGroup(requiredGuards, context, result, onProgress, 'all-must-pass')

      // Если обязательные прошли и есть опциональные
      if (requiredPassed && optionalGuards.length > 0) {
        await this.executeGuardGroup(optionalGuards, context, result, onProgress, 'at-least-one')
      }
    } catch (error) {
      console.error('Guards execution failed:', error)
      result.allowed = false
      result.failedGuards.push({
        id: 'system',
        reason: 'Системная ошибка проверки доступа',
        config: {} as GuardConfig,
      })
    }

    result.executionTime = Date.now() - startTime
    return result
  }

  private async executeGuardGroup(
    guards: GuardConfig[],
    context: GuardContext,
    result: GuardsExecutionResult,
    onProgress?: (guardId: string) => void,
    mode: 'all-must-pass' | 'at-least-one' = 'all-must-pass',
  ): Promise<boolean> {
    let anyPassed = false

    for (const guardConfig of guards) {
      onProgress?.(guardConfig.id)

      // Проверяем условие пропуска
      if (guardConfig.skipIf?.(context)) {
        result.skippedGuards.push(guardConfig.id)
        continue
      }

      try {
        const guardResult = await Promise.race([
          guardConfig.guard(context),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Guard timeout')), guardConfig.timeout || this.globalTimeout)),
        ])

        result.executedGuards.push(guardConfig.id)

        if (guardResult.allowed) {
          anyPassed = true
          if (mode === 'at-least-one') {
            return true // Достаточно одного успешного для опциональных
          }
        } else {
          result.failedGuards.push({
            id: guardConfig.id,
            reason: guardResult.reason || 'Доступ запрещен',
            config: guardConfig,
            metadata: guardResult.metadata,
          })

          guardConfig.onAccessDenied?.(guardResult.reason || 'Доступ запрещен', guardResult.metadata)

          if (mode === 'all-must-pass') {
            result.allowed = false
            return false
          }
        }
      } catch (error) {
        console.error(`Guard "${guardConfig.id}" failed:`, error)
        result.failedGuards.push({
          id: guardConfig.id,
          reason: error instanceof Error ? error.message : 'Ошибка выполнения guard',
          config: guardConfig,
        })

        if (mode === 'all-must-pass') {
          result.allowed = false
          return false
        }
      }
    }

    // Для опциональных guards нужен хотя бы один успешный
    if (mode === 'at-least-one' && guards.length > 0 && !anyPassed) {
      result.allowed = false
      return false
    }

    return true
  }
}
