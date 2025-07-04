import { Button } from '@components/ui'

import { useAuth } from '../../../../../auth'

export function ButtonExit() {
  const { isAuthenticated, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!isAuthenticated) return null

  return (
    <Button onClick={handleLogout} size="xs">
      Выйти
    </Button>
  )
}
