'use client'

import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { makeCn } from '@shared/utils'
import { ButtonC } from '@ui/common/ButtonC'
import { ImageC } from '@ui/common/ImageC'
import { TextC } from '@ui/common/TextC/TextC'
import style from './page.module.scss'

const cn = makeCn('Signin', style)

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return (
    <main className={cn()}>
      <section className={cn('Salutation')}>
        <ImageC
          src="base/me"
          sizes={{
            xl: '1000px', lg: '700px', lm: '400px', md: '200px', sm: '100px', xs: '50px', es: '10px',
          }}
          srcSet={{
            xl: 'base/me', lg: 'base/me1', lm: 'base/me', md: 'base/me1', sm: 'base/me', xs: 'base/me1', es: 'base/me',
          }}
          alt="s"
          width="1"
          height="1"
        />
        <TextC fs="54">
          Lorem ipsum dolor sit amet, consectetur radicalising elit.
          Animi cumque et ipsam non suscipit ullam velit vitae.
          Accusamus aspernatur eveniet fugiat numquam qui quisquam! Consequuntur earum harum id maiores nisi.
        </TextC>
      </section>
      <section className={cn('Enter')}>
        <ButtonC onClick={async () => {
          await signIn('google', { callbackUrl })
        }}
        >
          google
        </ButtonC>
      </section>
    </main>
  )
}
