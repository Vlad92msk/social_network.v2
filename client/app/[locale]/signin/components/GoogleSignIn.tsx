'use client'

import { signIn } from 'next-auth/react'
import { CommonButton } from '@ui/common/CommonButton'

export function GoogleSignIn() {
  return (
    <CommonButton onClick={async () => await signIn('google')}>
      google
    </CommonButton>
  )
}
