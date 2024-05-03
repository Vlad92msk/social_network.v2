import { IconBase } from '@ui/base/IconBase'
import { cn } from './cn'
import { useChatStore } from '../../../../_providers/chat'

export function VoiceMessage() {
  const onSubmitMessageText = useChatStore((store) => store.createMessage.text)
  const onSubmitMessage = useChatStore((store) => store.onSubmitMessage)

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
