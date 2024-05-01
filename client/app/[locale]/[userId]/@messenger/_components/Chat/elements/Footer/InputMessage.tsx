import { TextAreaCommon } from '@ui/common/InputCommon'
import { cn } from './cn'
import { useChatStore } from '../../../../_providers/chat'

export function InputMessage() {
  const onCreateMessage = useChatStore((store) => store.onCreateMessage)
  const createMessageText = useChatStore((store) => store.createMessage.text)

  return (
    <TextAreaCommon
      className={cn('InputMessage')}
      placeholder="Сообщение"
      value={createMessageText}
      onChange={(event) => onCreateMessage('text', event.target.value)}
    />
  )
}
