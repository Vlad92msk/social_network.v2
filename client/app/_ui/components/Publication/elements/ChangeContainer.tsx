import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { cn } from '../cn'
import { PublicationContextChangeState, usePublicationCtxSelect, usePublicationCtxUpdate } from '../Publication'

interface ChangeContainerProps {
  onSubmit: (data?: PublicationContextChangeState) => void
  onRemove: (id?: string) => void
}

export function ChangeContainer(props:ChangeContainerProps) {
  const { onSubmit, onRemove } = props
  const handleSetChangeActive = usePublicationCtxUpdate()
  const isChangeActive = usePublicationCtxSelect((ctx) => ctx.isChangeActive)
  const publicationId = usePublicationCtxSelect((ctx) => ctx.id)

  if (!isChangeActive) return null
  return (
    <div className={cn('ChangeContainer')}>
      <div className={cn('ChangeContainerMainActionList')}>
        <Button onClick={() => onRemove(publicationId)}>
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
        <Button onClick={() => handleSetChangeActive(({ changeState, id }) => {
          onSubmit({ ...changeState, id })
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
