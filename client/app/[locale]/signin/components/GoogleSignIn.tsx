'use client'

import { signIn } from 'next-auth/react'
import { useTranslate } from '@hooks'
import { ButtonCommon } from 'app/_ui/common/ButtonCommon'

export function GoogleSignIn() {
  const { translate, isLoading } = useTranslate()
  return (
    <ButtonCommon
      onClick={async () => await signIn('google')}
      isLoading={isLoading}
    >
      {translate?.('Auth.google')}
    </ButtonCommon>
  )
}
