import { TextArea } from 'app/_ui/common/Input'
import { cn } from './cn'
import { useMessageStore } from '../../../../_store'

export function InputMessage() {
  const onCreateMessage = useMessageStore((store) => store.onCreateMessage)
  const createMessageText = useMessageStore((store) => store.createMessage.text)

  return (
    <TextArea
      className={cn('InputMessage')}
      placeholder="Сообщение"
      value={createMessageText}
      onChange={(event) => onCreateMessage('text', event.target.value)}
    />
  )
}
