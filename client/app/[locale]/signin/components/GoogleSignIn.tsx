'use client'

import { signIn } from 'next-auth/react'
import { useTranslate } from '@hooks'
import { Button } from 'app/_ui/common/Button'

export function GoogleSignIn() {
  const { translate, isLoading } = useTranslate()
  return (
    <Button
      onClick={async () => await signIn('google')}
      isLoading={isLoading}
    >
      {translate?.('Auth.google')}
    </Button>
  )
}
