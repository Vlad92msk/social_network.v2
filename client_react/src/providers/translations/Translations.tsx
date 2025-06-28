// src/providers/translations/Translations.tsx
import { PropsWithChildren, useEffect, useState } from 'react'

import { i18nInitPromise } from '../../i18n/config'

export const Translations = (props: PropsWithChildren) => {
  const { children } = props
  const [isI18nReady, setIsI18nReady] = useState(false)

  useEffect(() => {
    // Ждем завершения инициализации i18n
    i18nInitPromise
      .then(() => {
        setIsI18nReady(true)
      })
      .catch((error) => {
        console.error('Failed to initialize i18n:', error)
        // Даже если произошла ошибка, показываем интерфейс
        setIsI18nReady(true)
      })
  }, [])

  if (!isI18nReady) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
        }}
      >
        Загрузка переводов...
      </div>
    )
  }

  return <>{children}</>
}
