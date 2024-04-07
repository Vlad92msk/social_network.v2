'use client'

import { useLocale } from '@hooks/useLocale'
import { PropsWithChildren } from 'react'

export function Html(props: PropsWithChildren) {
  const { children } = props
  const locale = useLocale()
  return (
    <html lang={locale}>
      {children}
    </html>
  )
}
