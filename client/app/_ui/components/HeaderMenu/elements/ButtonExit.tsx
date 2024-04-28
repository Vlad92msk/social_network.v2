import { signOut, useSession } from 'next-auth/react'
import { ButtonCommon } from 'app/_ui/common/ButtonCommon'


export function ButtonExit() {
  const { status } = useSession()

  if (status !== 'authenticated') return undefined
  return (
    <ButtonCommon onClick={() => signOut()} size="xs">
      Выйти
    </ButtonCommon>
  )
}
