import { ImageCommon } from '@ui/common/ImageCommon'
import { TextCommon } from '@ui/common/TextCommon'
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
        <TextCommon className={cn('InfoName')} fs="14">name</TextCommon>
        <TextCommon className={cn('OnlineStatus')} fs="10">Online</TextCommon>
      </div>
    </div>
  )
}
