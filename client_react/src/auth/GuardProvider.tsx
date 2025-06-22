import React, { createContext, useContext, useState, useCallback } from 'react'
import { guardDataStorage } from './utils'

interface GuardContextValue {
  guardData: Record<string, any>
  setGuardData: (key: string, value: any) => void
  getGuardData: (key: string) => any
  clearGuardData: () => void
}

const GuardContext = createContext<GuardContextValue | null>(null)

export function GuardProvider({ children }: { children: React.ReactNode }) {
  const [guardData, setGuardDataState] = useState<Record<string, any>>(() =>
    guardDataStorage.getAll()
  )

  const setGuardData = useCallback((key: string, value: any) => {
    setGuardDataState(prev => {
      const newData = { ...prev, [key]: value }
      guardDataStorage.set(key, value)
      return newData
    })
  }, [])

  const getGuardData = useCallback((key: string) => {
    return guardData[key] || guardDataStorage.get(key)
  }, [guardData])

  const clearGuardData = useCallback(() => {
    setGuardDataState({})
    guardDataStorage.clear()
  }, [])

  return (
    <GuardContext.Provider value={{ guardData, setGuardData, getGuardData, clearGuardData }}>
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
