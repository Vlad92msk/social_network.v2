'use client'

import { signIn } from 'next-auth/react'
import { CommonButton } from '@ui/common/CommonButton'
import { useTranslate } from '../../../_hooks'

export function GoogleSignIn() {
  const { translate, isLoading } = useTranslate()
  return (
    <CommonButton
      onClick={async () => await signIn('google')}
      isLoading={isLoading}
    >
      {translate?.('Auth.google')}
    </CommonButton>
  )
}
