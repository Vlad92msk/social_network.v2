import { makeCn } from '@shared/utils'
import { CommonText } from '@ui/common/CommonText/CommonText'
import { CommonImage } from 'app/_ui/common/CommonImage'
import { GoogleSignIn } from './components'
import style from './page.module.scss'

const cn = makeCn('Signin', style)

export default function SignInPage() {
  return (
    <main className={cn()}>
      <section className={cn('Salutation')}>
        <CommonImage
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
        <CommonText fs={{
          xl: '44',
          xs: '38',
          sm: '20',
          es: '8',
        }}
        >
          Lorem ipsum dolor sit amet, consectetur radicalising elit.
          Animi cumque et ipsam non suscipit ullam velit vitae.
          Accusamus aspernatur eveniet fugiat numquam qui quisquam! Consequuntur earum harum id maiores nisi.
        </CommonText>
      </section>
      <section className={cn('Enter')}>
        <GoogleSignIn />
      </section>
    </main>
  )
}
