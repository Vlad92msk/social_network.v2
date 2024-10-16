import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { useSelector } from 'react-redux'
import { cn } from '../cn'

interface SkeletonProps {
  headerComponent: React.ReactNode
  bodyComponent: React.ReactNode
  footerComponent: React.ReactNode
  fixedMessages: React.ReactNode
}

export function Skeleton(props: SkeletonProps) {
  const { headerComponent, footerComponent, bodyComponent, fixedMessages } = props
  const chatingPanelStatus = useSelector(MessengerSelectors.selectChatingPanelStatus)

  return (
    <div className={cn({ statusVisible: chatingPanelStatus })}>
      {chatingPanelStatus === 'open' && (
        <>
          <div className={cn('Header')}>
            {headerComponent}
          </div>
          {fixedMessages}
          <div className={cn('Body')}>
            {bodyComponent}
          </div>
          <div className={cn('Footer')}>
            {footerComponent}
          </div>
        </>
      )}
    </div>
  )
}
