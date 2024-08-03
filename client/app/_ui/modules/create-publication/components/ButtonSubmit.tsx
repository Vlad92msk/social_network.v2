import { compact, isEmpty as isEmptyLodash, pick, values } from 'lodash'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { CreatePublicationProps, initialState, SUBMIT_PROPS, useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '../ModuleCreatePublication'



interface ButtonSubmitProps extends Pick<CreatePublicationProps, 'onSubmit'>{

}

export function ButtonSubmit(props: ButtonSubmitProps) {
  const { onSubmit } = props
  const update = useCreatePublicationCtxUpdate()

  const isEmpty = useCreatePublicationCtxSelect((ctx) => {
    const targetValues = pick(ctx, SUBMIT_PROPS)
    const val = compact(values(targetValues))
    return isEmptyLodash(val)
  })

  return (
    <Button
      disabled={isEmpty}
      onClick={() => {
        update((ctx) => {
          // @ts-ignore
          onSubmit?.(pick(ctx, SUBMIT_PROPS))
          return initialState
        })
      }}
    >
      <Icon name="send" />
    </Button>
  )
}
