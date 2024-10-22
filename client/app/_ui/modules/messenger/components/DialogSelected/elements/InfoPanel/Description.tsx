import { useSelector } from 'react-redux'
import { cn } from './cn'
import { ImageTitle } from './ImageTitle'
import { ParticipantsOnline } from './ParticipantsOnline'
import { SearchUsers } from './SearchUsers'
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
        <SearchUsers />
      </div>
      <Summary title={currentDialog.description} />
    </div>
  )
}
