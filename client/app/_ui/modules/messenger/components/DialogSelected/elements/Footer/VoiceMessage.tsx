import { useProfile } from '@hooks'
import { Icon } from 'app/_ui/common/Icon'
import { cn } from './cn'
import { useMessageStore } from '../../../../store'

export function VoiceMessage() {
  const { profile } = useProfile()
  const onSubmitMessageText = useMessageStore((store) => store.createMessage.text)
  const onSubmitMessage = useMessageStore((store) => store.onSubmitMessage)

  if (onSubmitMessageText.length) {
    return (
      <button onClick={() => onSubmitMessage(profile?.userInfo!)}>
        <Icon name="send" />
      </button>
    )
  }

  return (
    <button className={cn('VoiceMessage')}>
      <Icon name="microphone" />
    </button>
  )
}
