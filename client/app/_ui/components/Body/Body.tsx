'use client'

import { useThemeServiceSelect } from '@providers/theme'
import { makeCn } from '@utils/others'
import { PropsWithChildren } from 'react'
import style from './Body.module.scss'

const cn = makeCn('Body', style)

export function Body(props: PropsWithChildren) {
  const { children } = props
  const theme = useThemeServiceSelect((contextStore) => contextStore.theme)

  return (
    <body className={cn({ theme })} data-theme={theme}>
      {children}
    </body>
  )
}
