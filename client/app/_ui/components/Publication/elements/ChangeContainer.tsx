import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Text } from '@ui/common/Text'
import { cn } from '../cn'
import { PublicationContextChangeState, usePublicationCtxSelect, usePublicationCtxUpdate } from '../Publication'

interface ChangeContainerProps {
  onSubmit: (data: PublicationContextChangeState) => void
  onRemove: (id: string) => void
  onPin?: (id: string) => void
  onAnswerEntity?: (id: string) => void
}

export function ChangeContainer(props:ChangeContainerProps) {
  const { onSubmit, onRemove, onPin, onAnswerEntity } = props
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
        <Button onClick={() => handleSetChangeActive(() => ({ isChangeActive: true }))}>
          <Icon name="edit" />
        </Button>
        {onPin && (
          <Button onClick={() => {
            onPin(publicationId)
            handleSetChangeActive(() => ({ isChangeActive: false, status: 'reset' }))
          }}
          >
            <Text fs="12">Закрепить/Открепить</Text>
          </Button>
        )}
        {onAnswerEntity && (
          <Button onClick={() => onAnswerEntity(publicationId)}>
            <Text fs="12">Ответить</Text>
          </Button>
        )}
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
