import { useSelector } from 'react-redux'
import { MessengerSelectors } from '../../../store/selectors'
import { cn } from '../cn'

interface SkeletonProps {
  headerComponent: React.ReactNode
  bodyComponent: React.ReactNode
  footerComponent: React.ReactNode
  fixedMessages: React.ReactNode
  usersTyping: React.ReactNode
  infoPanel: React.ReactNode
}

export function Skeleton(props: SkeletonProps) {
  const { headerComponent, footerComponent, bodyComponent, fixedMessages, usersTyping, infoPanel } = props
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
            <div className={cn('BodyUsersTyping')}>
              {usersTyping}
            </div>
          </div>
          <div className={cn('Footer')}>
            {footerComponent}
          </div>
        </>
      )}
      {infoPanel}
    </div>
  )
}
