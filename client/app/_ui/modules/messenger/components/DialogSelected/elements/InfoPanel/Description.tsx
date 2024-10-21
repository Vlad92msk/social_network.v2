import { useSelector } from 'react-redux'
import { Text } from '@ui/common/Text'
import { cn } from './cn'
import { ImageTitle } from './ImageTitle'
import { ParticipantsOnline } from './ParticipantsOnline'
import { Summary } from './Summary'
import { Title } from './Title'
import { MessengerSelectors } from '../../../../store/selectors'

export function Description() {
  const currentDialog = useSelector(MessengerSelectors.selectCurrentDialog)

  if (!currentDialog) return null
  return (
    <div className={cn('Description')}>
      <ImageTitle image={currentDialog.image} />
      <Title title={currentDialog.title} />
      <ParticipantsOnline />
      <div className={cn('ActionButtons')}>
        <Text as="button" fs="12" uppercase letterSpacing={0.18}>
          Добавить участника
        </Text>
      </div>
      <Summary title={currentDialog.description} />
    </div>
  )
}
