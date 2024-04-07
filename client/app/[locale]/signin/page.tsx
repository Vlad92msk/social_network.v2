import { makeCn } from '../../_utils/others'
import { CommonText } from '@ui/common/CommonText/CommonText'
import { GoogleSignIn } from './components'
import style from './page.module.scss'

const cn = makeCn('Signin', style)

export default function SignInPage() {
  return (
    <main className={cn()}>
      <section className={cn('Salutation')}>
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
