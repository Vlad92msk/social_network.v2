import { TextAreaEmoji } from '@ui/common/Input'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '../CreatePublication'

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
