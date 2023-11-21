'use client'

import { Icon } from '@ui/base/Icon'
import { signOut, useSession } from 'next-auth/react'

export function Section() {
  const session = useSession()
  // console.log('session', session)
  return (
    <>
      <div>section 1</div>
      <button onClick={() => signOut()}>
        Выйти
      </button>
      <Icon name="git" fill="#000" />
    </>
  )
}
