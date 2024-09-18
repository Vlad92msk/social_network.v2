'use client'

import { SessionProvider as Session } from 'next-auth/react'
import { PropsWithChildren } from 'react'

export function SessionProvider(props: PropsWithChildren) {
  return (
    <Session>
      {props.children}
    </Session>
  )
}
