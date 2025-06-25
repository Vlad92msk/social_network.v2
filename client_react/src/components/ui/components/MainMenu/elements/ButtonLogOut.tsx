import { useAuth } from '../../../../../auth'
import { Button } from '../../../common/Button'
import { Text } from '../../../common/Text'
import { Icon } from '../../../icon'
import { cn } from '../cn'

export function ButtonLogOut() {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <Button
      className={cn('NavigationButton')}
      size="sm"
      onClick={handleLogout}
    >
      <Icon name="sign-out" />
      <Text
        className={cn('NavigationButtonText')}
        fs={{ es: '14', md: '16' }}
      >
        Выйти
      </Text>
    </Button>
  )
}
