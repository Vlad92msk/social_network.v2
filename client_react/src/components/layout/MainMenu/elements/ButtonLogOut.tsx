import { useAuth } from '../../../../auth'
import { Icon } from '../../../ui'
import { Button } from '../../../ui/common/Button'
import { Text } from '../../../ui/common/Text'
import { cn } from '../cn'

export function ButtonLogOut() {
  const { signOut } = useAuth()

  return (
    <Button
      className={cn('NavigationButton')}
      size="sm"
      onClick={() => signOut()}
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
