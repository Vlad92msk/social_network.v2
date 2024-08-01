'use client'

import { PropsWithChildren } from 'react'
import { useThemeServiceSelect } from '@providers/theme'
import { makeCn } from '@utils/others'
import style from './Body.module.scss'

const cn = makeCn('Body', style)

export function Body(props: PropsWithChildren) {
  const { children } = props
  const theme = useThemeServiceSelect((contextStore) => contextStore.theme)

  return (
    <body className={cn({ theme })} data-project-theme={theme}>
      {children}
      <section id="modals" style={{ zIndex: 1, position: 'relative' }} />
      <section id="notifications" style={{ zIndex: 2, position: 'relative' }} />
    </body>
  )
}
