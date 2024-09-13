'use client'

import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useDispatch } from 'react-redux'
import { Icon } from '@ui/common/Icon'
import { Button } from 'app/_ui/common/Button'
import { CounterSliceActions } from '../../../_store/messagesReducer'

interface GoogleSignInProps {
  className?: string
}

export function GoogleSignIn(props: GoogleSignInProps) {
  const { className } = props
  const dispatch = useDispatch()
  const t = useTranslations()

  return (
    <div>
      <Button
        className={className}
        onClick={() => dispatch(CounterSliceActions.setGroupId(100))}
      >
        <Icon name="git" />
      </Button>
      <Button
        className={className}
        onClick={() => dispatch(({ type: 'SOME_ACTION' }))}
      >
        <Icon name="chat" />
      </Button>
      <Button
        className={className}
        onClick={async () => await signIn('google')}
      >
        <Icon name="google" />
      </Button>
    </div>
  )
}
