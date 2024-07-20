import { useMessageStore } from '../../../_providers/message/message.provider'
import { cn } from '../cn'

interface SkeletonProps {
  renderHeader: React.ReactNode
  renderBody: React.ReactNode
  renderFooter: React.ReactNode
}

export function Skeleton(props: SkeletonProps) {
  const { renderHeader, renderFooter, renderBody } = props
  const chatingPanelStatus = useMessageStore((state) => state.chatingPanelStatus)
console.log('chatingPanelStatus', chatingPanelStatus)
  return (
    <div className={cn({ statusVisible: chatingPanelStatus })}>
      <div className={cn('Header')}>
        {renderHeader}
      </div>
      <div className={cn('Body')}>
        {renderBody}
      </div>
      <div className={cn('Footer')}>
        {renderFooter}
      </div>
    </div>
  )
}
