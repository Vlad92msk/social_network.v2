import { useSelector } from 'react-redux'
import { Image } from '@ui/common/Image'
import { Text } from '@ui/common/Text'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { cn } from './cn'

export function Description() {
  const currentDialog = useSelector(MessengerSelectors.selectCurrentDialog)
  const active = useSelector(MessengerSelectors.selectCurrentDialogActiveParticipants)

  if (!currentDialog) return null
  return (
    <div className={cn('Description')}>
      <div className={cn('Image')}>
        <Image alt="d" width={20} height={20} src={currentDialog.image} />
      </div>
      <Text className={cn('Title')} weight="bold">{currentDialog.title || 'Нет заголовка'}</Text>
      <div className={cn('ParticipantsOnline')}>
        <Text>{`Участников ${currentDialog.participants.length}`}</Text>
        <Text>{`В сети ${active.length - 1}`}</Text>
      </div>
      <div className={cn('ActionButtons')}>
        <Text as="button" fs="12" uppercase letterSpacing={0.18}>
          Добавить участника
        </Text>
      </div>
      <div className={cn('Information')}>
        <Text>{currentDialog.description || 'Нет описания'}</Text>
      </div>
    </div>
  )
}
