import { PropsWithChildren, useEffect } from 'react'
import { createStoreContext } from '@utils'

import { initialState, ThemeServiceContext } from './context/initialState'

export const {
  contextWrapper,
  useStoreSelector: useThemeServiceSelect,
  useStoreDispatch: useThemeServiceUpdate,
} = createStoreContext({
  initialState,
})

// import style from './body.module.scss'
//
// const cn = makeCn('body', style)

const ThemeProviderInner = ({ children }: PropsWithChildren) => {
  const theme = useThemeServiceSelect((contextStore) => contextStore.theme)

  useEffect(() => {
    // Устанавливаем класс и data-атрибут на body
    document.body.className = `body--theme-${theme}`
    // document.body.className = cn({ theme })
    document.body.setAttribute('data-project-theme', theme)

    // Cleanup function (опционально)
    return () => {
      document.body.removeAttribute('data-project-theme')
      document.body.className = ''
    }
  }, [theme])

  return <>{children}</>
}

export const ThemeProvider = contextWrapper<PropsWithChildren, ThemeServiceContext>(ThemeProviderInner)
