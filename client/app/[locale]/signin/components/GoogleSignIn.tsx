'use client'

import { Icon } from '@ui/common/Icon'
import { signIn } from 'next-auth/react'
import {useTranslations} from 'next-intl';
import { Button } from 'app/_ui/common/Button'
import { useDispatch } from "react-redux";

interface GoogleSignInProps {
  className?: string
}

export function GoogleSignIn(props: GoogleSignInProps) {
  const {className} = props
  const dispatch = useDispatch();
  const t = useTranslations()

  return (
<div>
  <Button
      className={className}
      onClick={() => dispatch(({ type: 'SOME_ACTION' }))}
  >
    <Icon name={'chat'} />
  </Button>
  <Button
      className={className}
      onClick={async () => await signIn('google')}
  >
    <Icon name={'google'} />
  </Button>
</div>
  )
}
