import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { cn } from '../cn'
import { PublicationContextChangeState, usePublicationCtxUpdate } from '../Publication'

interface ChangeContainerProps {
  onSubmit: (data?: PublicationContextChangeState) => void
  onRemove: VoidFunction
}

export function ChangeContainer(props:ChangeContainerProps) {
  const { onSubmit, onRemove } = props
  const handleSetChangeActive = usePublicationCtxUpdate()
  return (
    <div className={cn('ChangeContainer')}>
      <div className={cn('ChangeContainerMainActionList')}>
        <Button onClick={onRemove}>
          <Icon name="delete" />
        </Button>
        <Button>
          <Icon name="edit" onClick={() => handleSetChangeActive(() => ({ isChangeActive: true }))} />
        </Button>
      </div>
      <div className={cn('ChangeContainerSubmitActionList')}>
        <Button>
          <Icon
            name="close"
            onClick={() => handleSetChangeActive(() => ({ isChangeActive: false, status: 'reset' }))}
          />
        </Button>
        <Button onClick={() => handleSetChangeActive(({ changeState }) => {
          onSubmit(changeState)
          return ({
            isChangeActive: false,
            status: 'approve',
          })
        })}
        >
          <Icon name="approve" />
        </Button>
      </div>
    </div>
  )
}
