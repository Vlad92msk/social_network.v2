import { ButtonCommon } from '@ui/common/ButtonCommon'
import { cn } from './cn'
import { useChatStore } from '../../../../_providers/chat'

export function VoiceMessage() {
  const onSubmitMessageText = useChatStore((store) => store.createMessage.text)
  const onSubmitMessage = useChatStore((store) => store.onSubmitMessage)

  if (onSubmitMessageText.length) {
    return (
      <ButtonCommon
        onClick={onSubmitMessage}
        size="es"
      >
        ок
      </ButtonCommon>
    )
  }

  return <ButtonCommon className={cn('VoiceMessage')}>Voice</ButtonCommon>
}
