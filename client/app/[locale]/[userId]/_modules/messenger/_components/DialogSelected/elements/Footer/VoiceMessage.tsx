import { useProfile } from '@hooks'
import { Icon } from 'app/_ui/common/Icon'
import { cn } from './cn'
import { useDialogStore } from '../../../../_providers/dialogSelected'

export function VoiceMessage() {
  const { profile } = useProfile()
  const onSubmitMessageText = useDialogStore((store) => store.createMessage.text)
  const onSubmitMessage = useDialogStore((store) => store.onSubmitMessage)

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
