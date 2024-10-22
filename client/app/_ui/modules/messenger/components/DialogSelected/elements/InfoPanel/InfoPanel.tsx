import { useSelector } from 'react-redux'
import { CloseButton } from './CloseButton'
import { cn } from './cn'
import { Description } from './Description'
import { Media } from './Media'
import { SwitchDialogType } from './SwitchDialogType'
import { MessengerSelectors } from '../../../../store/selectors'

export function InfoPanel() {
  const infoPanelStatus = useSelector(MessengerSelectors.selectInfoPanelStatus)

  return (
    <div className={cn({ status: infoPanelStatus })}>
      <div className={cn('Header')}>
        <SwitchDialogType />
        <CloseButton />
      </div>
      <Description />
      <Media />
    </div>
  )
}
