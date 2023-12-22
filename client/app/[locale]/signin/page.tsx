'use client'

import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { makeCn } from '@shared/utils'
import { ButtonC } from '@ui/common/ButtonC'
import style from './page.module.scss'

const cn = makeCn('Signin', style)

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return (
    <div className={cn()}>
      SignIn
      <ButtonC onClick={async () => {
        await signIn('google', { callbackUrl })
      }}
      >
        google
      </ButtonC>
    </div>
  )
}
