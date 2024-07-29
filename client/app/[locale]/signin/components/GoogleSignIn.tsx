'use client'

import { Icon } from '@ui/common/Icon'
import { signIn } from 'next-auth/react'
import {useTranslations} from 'next-intl';
import { Button } from 'app/_ui/common/Button'

interface GoogleSignInProps {
  className?: string
}

export function GoogleSignIn(props: GoogleSignInProps) {
  const {className} = props
  const t = useTranslations()
  return (
    <Button
      className={className}
      onClick={async () => await signIn('google')}
    >
      <Icon name={'google'} />
    </Button>
  )
}
