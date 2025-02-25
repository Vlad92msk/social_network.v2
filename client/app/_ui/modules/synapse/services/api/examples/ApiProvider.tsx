/**
 * Провайдер контекста для API
 */
import React, { ReactNode, useEffect, useState } from 'react'
import { pokemonApi } from './pokemon-api'
import { ApiClientContext } from '../hooks/use-api-client'

interface ApiProviderProps {
  children: ReactNode;
}

/**
 * Провайдер контекста для API клиента
 */
export const ApiProvider: React.FC<ApiProviderProps> = ({
  children,
}) => {
  // Добавляем только cleanup при размонтировании
  useEffect(() => {
    return () => {
      pokemonApi.destroy()
    }
  }, [])

  return (
    <ApiClientContext.Provider value={pokemonApi}>
      {children}
    </ApiClientContext.Provider>
  )
}
