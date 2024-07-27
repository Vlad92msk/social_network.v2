import { TextAreaEmoji } from 'app/_ui/common/Input'
import { cn } from './cn'
import { useMessageStore } from '../../../../store'

export function InputMessage() {
  const onCreateMessage = useMessageStore((store) => store.onCreateMessage)
  const createMessageText = useMessageStore((store) => store.createMessage.text)

  return (
    <TextAreaEmoji
      className={cn('InputMessage')}
      placeholder="Сообщение"
      value={createMessageText}
      onValueChange={(value) => onCreateMessage('text', value)}
    />
  )
}
