import { useSelector } from 'react-redux'
import { Text } from '@ui/common/Text'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { cn } from './cn'

export function ParticipantsOnline() {
  const currentDialog = useSelector(MessengerSelectors.selectCurrentDialog)
  const active = useSelector(MessengerSelectors.selectCurrentDialogActiveParticipants)

  if (!currentDialog) return null
  return (
    <div className={cn('ParticipantsOnline')}>
      <Text>{`Участников ${currentDialog.participants.length}`}</Text>
      <Text>{`В сети ${active.length - 1}`}</Text>
    </div>
  )
}
