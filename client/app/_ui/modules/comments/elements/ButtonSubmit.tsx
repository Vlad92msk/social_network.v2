import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { cn } from '../cn'

export const ButtonSubmit = () => {



  return (
    <div className={cn('SubmitActions')}>
      <Button>
        <Icon name={'close'} />
      </Button>
      <Button>
        <Icon name={'send'} />
      </Button>
    </div>
  )
}
