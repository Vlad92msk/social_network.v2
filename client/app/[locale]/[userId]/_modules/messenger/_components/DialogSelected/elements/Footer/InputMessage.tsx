import { TextArea } from 'app/_ui/common/Input'
import { cn } from './cn'
import { useDialogStore } from '../../../../_providers/dialogSelected'

export function InputMessage() {
  const onCreateMessage = useDialogStore((store) => store.onCreateMessage)
  const createMessageText = useDialogStore((store) => store.createMessage.text)

  return (
    <TextArea
      className={cn('InputMessage')}
      placeholder="Сообщение"
      value={createMessageText}
      onChange={(event) => onCreateMessage('text', event.target.value)}
    />
  )
}
