import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { cn } from '../cn'

interface ButtonSubmitProps {
  onClose?: VoidFunction
  onSubmit: (comment: string) => void
}

export function ButtonSubmit(props: ButtonSubmitProps) {
  const { onClose, onSubmit } = props
  return (
    <div className={cn('SubmitActions')}>
      <Button className={cn('SubmitButton')} onClick={onClose}>
        <Icon name="close" />
      </Button>
      <Button className={cn('SubmitButton')} onClick={() => onSubmit('my comment')}>
        <Icon name="send" />
      </Button>
    </div>
  )
}
