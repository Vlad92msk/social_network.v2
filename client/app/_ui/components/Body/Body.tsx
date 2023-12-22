'use client'

import { PropsWithChildren } from 'react'
import { useThemeServiceSelect } from '@services/theme'
import { makeCn } from '@shared/utils/makeCn'

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
