import React, { createContext, useContext, useState, useCallback } from 'react'
import { guardDataStorage } from './utils'

interface GuardGlobalConfig {
  // Глобальные компоненты для отказа в доступе
  accessDeniedComponent?: React.ReactNode
  accessDeniedPage?: string

  // Глобальная обработка событий
  onAccessDenied?: (reason: string, metadata?: Record<string, any>) => void

  // Глобальные таймауты
  defaultTimeout?: number

  // Глобальные настройки логирования
  enableLogging?: boolean
  logPrefix?: string
}

interface GuardContextValue {
  // Данные для guards
  guardData: Record<string, any>
  setGuardData: (key: string, value: any) => void
  getGuardData: (key: string) => any
  clearGuardData: VoidFunction

  // Глобальная конфигурация
  globalConfig: GuardGlobalConfig
  updateGlobalConfig: (config: Partial<GuardGlobalConfig>) => void
}

const GuardContext = createContext<GuardContextValue | null>(null)

interface GuardProviderProps {
  children: React.ReactNode
  config?: GuardGlobalConfig
}

export function GuardProvider({ children, config = {} }: GuardProviderProps) {
  const [guardData, setGuardDataState] = useState<Record<string, any>>(() =>
    guardDataStorage.getAll()
  )

  const [globalConfig, setGlobalConfig] = useState<GuardGlobalConfig>(config)

  const setGuardData = useCallback((key: string, value: any) => {
    if (globalConfig.enableLogging) {
      console.log(`${globalConfig.logPrefix || '[GuardData]'} Set: ${key}`, value)
    }

    setGuardDataState(prev => {
      const newData = { ...prev, [key]: value }
      guardDataStorage.set(key, value)
      return newData
    })
  }, [globalConfig.enableLogging, globalConfig.logPrefix])

  const getGuardData = useCallback((key: string) => {
    const value = guardData[key] || guardDataStorage.get(key)

    if (globalConfig.enableLogging) {
      console.log(`${globalConfig.logPrefix || '[GuardData]'} Get: ${key}`, value)
    }

    return value
  }, [guardData, globalConfig.enableLogging, globalConfig.logPrefix])

  const clearGuardData = useCallback(() => {
    if (globalConfig.enableLogging) {
      console.log(`${globalConfig.logPrefix || '[GuardData]'} Clear all data`)
    }

    setGuardDataState({})
    guardDataStorage.clear()
  }, [globalConfig.enableLogging, globalConfig.logPrefix])

  const updateGlobalConfig = useCallback((newConfig: Partial<GuardGlobalConfig>) => {
    setGlobalConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  const contextValue: GuardContextValue = {
    guardData,
    setGuardData,
    getGuardData,
    clearGuardData,
    globalConfig,
    updateGlobalConfig
  }

  return (
    <GuardContext.Provider value={contextValue}>
      {children}
    </GuardContext.Provider>
  )
}

export function useGuardData(): GuardContextValue {
  const context = useContext(GuardContext)
  if (!context) {
    throw new Error('useGuardData must be used within GuardProvider')
  }
  return context
}
