import { useMemo, useCallback, useState } from 'react'
import { GuardsExecutor } from '../guards/GuardsExecutor.ts'
import { GuardConfig, GuardContext, GuardsExecutionResult } from '../types'

interface UseGuardsExecutorReturn {
  execute: (guards: GuardConfig[], context: GuardContext) => Promise<GuardsExecutionResult>
  isExecuting: boolean
  currentGuard?: string
}

/**
 * Хук для работы с GuardsExecutor
 */
export function useGuardsExecutor(globalTimeout?: number): UseGuardsExecutorReturn {
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentGuard, setCurrentGuard] = useState<string>()

  const executor = useMemo(() => new GuardsExecutor(globalTimeout), [globalTimeout])

  const execute = useCallback(async (
    guards: GuardConfig[],
    context: GuardContext
  ): Promise<GuardsExecutionResult> => {
    setIsExecuting(true)
    setCurrentGuard(undefined)

    try {
      const result = await executor.execute(guards, context, (guardId) => {
        setCurrentGuard(guardId)
      })
      return result
    } finally {
      setIsExecuting(false)
      setCurrentGuard(undefined)
    }
  }, [executor])

  return { execute, isExecuting, currentGuard }
}
