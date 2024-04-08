import { signOut, useSession } from 'next-auth/react'
import { CommonButton } from '@ui/common/CommonButton'


export function ButtonExit() {
  const { status } = useSession()

  if (status !== 'authenticated') return undefined
  return (
    <CommonButton onClick={() => signOut()} size="xs">
      Выйти
    </CommonButton>
  )
}
