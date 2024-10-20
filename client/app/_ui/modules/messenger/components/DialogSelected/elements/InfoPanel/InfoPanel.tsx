import { useSelector } from 'react-redux'
import { Text } from '@ui/common/Text'
import { CloseButton } from './CloseButton'
import { cn } from './cn'
import { Description } from './Description'
import { Media } from './Media'
import { MessengerSelectors } from '../../../../store/selectors'

export function InfoPanel() {
  const infoPanelStatus = useSelector(MessengerSelectors.selectInfoPanelStatus)

  return (
    <div className={cn({ status: infoPanelStatus })}>
      <div className={cn('Header')}>
        <CloseButton />
        <Text fs="14">Информация</Text>
      </div>
      <Description />
      <Media />
    </div>
  )
}
