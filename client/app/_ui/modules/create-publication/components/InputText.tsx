import { TextAreaEmoji } from '@ui/common/Input'
import { useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '../ModuleCreatePublication'
import { cn } from '@ui/modules/create-publication/cn'
import { setImmutable } from '@utils/others'


interface InputTextProps {
  placeholder: string
}

export function InputText(props: InputTextProps) {
  const { placeholder } = props
  const text = useCreatePublicationCtxSelect((ctx) => ctx.text)
  const update = useCreatePublicationCtxUpdate()


  return (
    <TextAreaEmoji
      className={cn('AddCommentInput')}
      placeholder={placeholder}
      value={text}
      onValueChange={(value) => {
        update((ctx) => setImmutable(ctx, 'text', value))
      }}
    />
  )
}
