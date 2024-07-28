'use client'

import { signIn } from 'next-auth/react'
import {useTranslations} from 'next-intl';
import { Button } from 'app/_ui/common/Button'

export function GoogleSignIn() {
  const t = useTranslations()
  return (
    <Button
      onClick={async () => await signIn('google')}
    >
      {t('Auth.google')}
    </Button>
  )
}
