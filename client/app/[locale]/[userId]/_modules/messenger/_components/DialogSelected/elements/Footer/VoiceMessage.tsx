import { IconBase } from '@ui/base/IconBase'
import { cn } from './cn'
import { useDialogStore } from '../../../../_providers/dialogSelected'

export function VoiceMessage() {
  const onSubmitMessageText = useDialogStore((store) => store.createMessage.text)
  const onSubmitMessage = useDialogStore((store) => store.onSubmitMessage)

  if (onSubmitMessageText.length) {
    return (
      <button onClick={onSubmitMessage}>
        <IconBase name="send" />
      </button>
    )
  }

  return (
    <button className={cn('VoiceMessage')}>
      <IconBase name="microphone" />
    </button>
  )
}
