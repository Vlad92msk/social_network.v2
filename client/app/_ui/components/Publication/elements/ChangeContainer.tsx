import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { cn } from '../cn'
import { usePublicationCtxUpdate } from '../Publication'

export function ChangeContainer() {
  const handleSetChangeActive = usePublicationCtxUpdate()

  return (
    <div className={cn('ChangeContainer')}>
      <div className={cn('ChangeContainerMainActionList')}>
        <Button>
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
            onClick={() => handleSetChangeActive(({ changeState, ...ctx }) => {
              const newState = {
                ...ctx,
                isChangeActive: false,
              }
              return ({
                ...newState,
                changeState: newState,
              })
            })}
          />
        </Button>
        <Button onClick={() => handleSetChangeActive(({ changeState }) => ({ ...changeState, changeState }))}>
          <Icon name="approve" />
        </Button>
      </div>
    </div>
  )
}
