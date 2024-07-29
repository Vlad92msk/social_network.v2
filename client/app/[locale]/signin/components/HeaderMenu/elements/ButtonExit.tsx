import { signOut, useSession } from 'next-auth/react'
import { Button } from '@ui/common/Button'


export function ButtonExit() {
  const { status } = useSession()

  if (status !== 'authenticated') return undefined
  return (
    <Button onClick={() => signOut()} size="xs">
      Выйти
    </Button>
  )
}
