import { compact, isEmpty as isEmptyLodash, pick, values } from 'lodash'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { CreatePublicationProps, initialState, SUBMIT_PROPS, useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '..'
import { cn } from '../cn'

interface ButtonResetProps extends Pick<CreatePublicationProps, 'onReset'>{

}

export function ButtonReset(props: ButtonResetProps) {
  const { onReset } = props
  const isEmpty = useCreatePublicationCtxSelect((ctx) => {
    const targetValues = pick(ctx, SUBMIT_PROPS)
    const val = compact(values(targetValues))
    return isEmptyLodash(val)
  })

  const editorControls = useCreatePublicationCtxSelect(ctx => ctx.s)

  const update = useCreatePublicationCtxUpdate()
  return (
    <Button
      className={cn('ButtonReset', { active: !isEmpty })}
      disabled={isEmpty}
      onClick={() => {
        editorControls?.reset?.()
        update(() => {
          onReset?.()
          return initialState
        })
      }}
    >
      <Icon name="close" />
    </Button>
  )
}
