import { useSelector } from 'react-redux'
import { Text } from '@ui/common/Text'
import { Image } from 'app/_ui/common/Image'
import { MessengerSelectors } from '../../../store/selectors'
import { cn } from '../cn'

export const UsersTyping = () => {
  const participants = useSelector(MessengerSelectors.selectCurrentDialogParticipants)
  const usersTyping = useSelector(MessengerSelectors.selectCurrentDialogUsersTyping)

  return Object.entries(usersTyping).map(([key, value]) => {
    const participant = participants.get(Number(key))

    if (!value || !participant) return null
    return (
      <div key={key} className={cn('BodyUsersTypingBox')}>
        <div className={cn('BodyUsersTypingImgBox')}>
          <Image src={participant.profile_image} alt={participant.name} width={20} height={20} />
        </div>
        <Text fs="10" weight="light">
          печатает...
        </Text>
      </div>
    )
  })
}
