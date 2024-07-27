import { size } from 'lodash'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { AboutMeProps, useAboutMeCtxSelect, useAboutMeCtxUpdate } from '../AboutMe'
import { cn } from '../cn'

interface ButtonEditProps {
  onSubmit: AboutMeProps['onSubmit']
}

export function ButtonEdit(props: ButtonEditProps) {
  const { onSubmit } = props
  const aboutMeUpdate = useAboutMeCtxUpdate()
  const disabled = useAboutMeCtxSelect((ctx) => !Boolean(size(ctx.changeState)))
  const isChangeActive = useAboutMeCtxSelect((ctx) => ctx.isChangeActive)

  return (
    <div className={cn('ButtonEdit')}>
      {isChangeActive && (
        <Button>
          <Icon
            name="close"
            onClick={() => aboutMeUpdate(() => ({ isChangeActive: false, status: 'reset', changeState: {} }))}
          />
        </Button>
      )}
      {isChangeActive && (
        <Button
          disabled={disabled}
          onClick={() => aboutMeUpdate(({ changeState }) => {
            onSubmit?.(changeState)
            return ({
              isChangeActive: false,
              status: 'approve',
              changeState: {},
            })
          })}
        >
          <Icon name="approve" />
        </Button>
      )}

      <Button onClick={() => aboutMeUpdate(({ isChangeActive }) => ({ isChangeActive: !isChangeActive }))}>
        <Icon name="edit" />
      </Button>
    </div>
  )
}
