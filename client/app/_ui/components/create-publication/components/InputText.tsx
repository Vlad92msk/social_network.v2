import { TextAreaEmoji } from '@ui/common/Input'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '../CreatePublication'

interface InputTextProps {
  placeholder: string
  onStartTyping?: VoidFunction
  onStopTyping?: VoidFunction
}

export function InputText(props: InputTextProps) {
  const { placeholder, onStopTyping, onStartTyping } = props
  const text = useCreatePublicationCtxSelect((ctx) => ctx.text)
  const update = useCreatePublicationCtxUpdate()

  return (
    <TextAreaEmoji
      className={cn('AddCommentInput')}
      placeholder={placeholder}
      value={text}
      onStartTyping={onStartTyping}
      onStopTyping={onStopTyping}
      onValueChange={(value) => {
        update((ctx) => setImmutable(ctx, 'text', value))
      }}
    />
  )
}
