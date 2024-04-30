import { ImageCommon } from '@ui/common/ImageCommon'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface ContactInfoProps {
  className?: string
}

export function ContactInfo(props: ContactInfoProps) {
  const { className } = props

  return (
    <div
      className={classNames(cn('ContactInfo'), className)}
    >
      <div className={cn('ImgContainer')}>
        <ImageCommon src="base/me" alt="contact" width={50} height={50} />
      </div>
      <div className={cn('Info')}>
        <div className={cn('InfoName')}>name</div>
        <div className={cn('OnlineStatus')}>Online</div>
      </div>
    </div>
  )
}
