'use client'

import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default async function SignInPage(props) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return (
    <div>
      SignIn
      <button onClick={async () => {
        await signIn('google', { callbackUrl })
      }}
      >
        google
      </button>
    </div>
  )
}
