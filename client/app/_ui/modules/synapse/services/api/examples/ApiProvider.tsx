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
  const [isInitialized, setIsInitialized] = useState(false)

  // Выбираем API в зависимости от настроек кэширования

  useEffect(() => {
    // Инициализируем API клиент при монтировании
    pokemonApi.waitForInitialization().then(() => {
      setIsInitialized(true)
    }).catch((error) => {
      console.error('Failed to initialize API client:', error)
      // Всё равно считаем инициализированным, чтобы приложение продолжило работу
      setIsInitialized(true)
    })

    // Очистка ресурсов при размонтировании
    return () => {
      pokemonApi.dispose()
    }
  }, [])

  if (!isInitialized) {
    // Можно показать лоадер, пока API инициализируется
    return <div>Initializing API...</div>
  }

  return (
    <ApiClientContext.Provider value={pokemonApi}>
      {children}
    </ApiClientContext.Provider>
  )
}
