'use client'

import { signIn } from 'next-auth/react'
import { ButtonCommon } from 'app/_ui/common/ButtonCommon'
import { useTranslate } from '../../../_hooks'

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
