import { useAuthActions } from '../../../auth'
import { Icon } from '../../../components/ui'
import { Button } from '../../../components/ui/common/Button'

interface GoogleSignInProps {
  className?: string
}

export function GoogleSignIn(props: GoogleSignInProps) {
  const { className } = props
  const { handleGoogleSignIn, isLoading } = useAuthActions()

  return (
    <Button
      className={className}
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      <Icon name="google" />
      {isLoading ? 'Загрузка...' : 'Google'}
    </Button>
  )
}
