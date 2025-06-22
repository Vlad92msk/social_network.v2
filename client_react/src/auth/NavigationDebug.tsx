import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function NavigationDebug() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('🧭 Навигация изменилась:', {
      pathname: location.pathname,
      search: location.search,
      state: location.state,
      timestamp: new Date().toISOString()
    })
  }, [location])

  // Перехватываем вызовы navigate для отладки
  useEffect(() => {
    const originalNavigate = navigate

    // Создаем прокси для navigate (только для отладки)
    const debugNavigate = (...args: any[]) => {
      console.log('🔄 navigate() вызван с аргументами:', args)
      console.trace('🔍 Stack trace для navigate:')
      // @ts-ignore
      return originalNavigate(...args)
    }

    // В production это делать не стоит, только для отладки
    if (import.meta.env.DEV) {
      // @ts-ignore - только для отладки
      window.__debugNavigate = debugNavigate
    }
  }, [navigate])

  return null // Компонент не рендерит ничего, только логирует
}
