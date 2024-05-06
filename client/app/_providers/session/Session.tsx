'use client'

import { SessionProvider } from 'next-auth/react'
import { PropsWithChildren } from 'react'

export function Session(props: PropsWithChildren) {
  return (
    <SessionProvider>
      {props.children}
    </SessionProvider>
  )
}
