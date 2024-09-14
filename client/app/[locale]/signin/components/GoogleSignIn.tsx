'use client'

import { Icon } from '@ui/common/Icon'
import { Button } from 'app/_ui/common/Button'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'

interface GoogleSignInProps {
  className?: string
}

export function GoogleSignIn(props: GoogleSignInProps) {
  const { className } = props
  const t = useTranslations()

  return (
    <div>
      <Button
        className={className}
        onClick={async () => await signIn('google')}
      >
        <Icon name="google" />
      </Button>
    </div>
  )
}
