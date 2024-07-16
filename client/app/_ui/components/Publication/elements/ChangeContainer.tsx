import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { cn } from '../cn'

interface AuthorProps {
  autor?: { name: string }
}
export function ChangeContainer(props: AuthorProps) {
  const { autor } = props
  return (
    <div className={cn('ChangeContainer')}>
      <div className={cn('ChangeContainerMainActionList')}>
        <Button>
          <Icon name="delete" />
        </Button>
        <Button>
          <Icon name="edit" />
        </Button>
      </div>
      <div className={cn('ChangeContainerSubmitActionList')}>
        <Button>
          <Icon name="close" />
        </Button>
        <Button>
          <Icon name="approve" />
        </Button>
      </div>
    </div>
  )
}
