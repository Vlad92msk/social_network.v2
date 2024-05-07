import { SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'
import { useProfile } from '@hooks'
import { SpinnerBase } from '@ui/base/SpinnerBase'
import { ImageCommon } from '@ui/common/ImageCommon'
import { TextCommon } from '@ui/common/TextCommon'
import { classNames } from '@utils/others'
import { cn } from './cn'
import { useDialogStore } from '../../../../_providers/dialogSelected'

interface ContactInfoProps {
  className?: string
}

export function ContactInfo(props: ContactInfoProps) {
  const { className } = props
  const { apiStatus, apiError } = useDialogStore((store) => store.getCurrentDialog())
  const { profile } = useProfile()

  const { img, name, status } = useDialogStore((store) => {
    const { apiData } = store.getCurrentDialog()

    const byDefault = {
      img: <ImageCommon alt="contact" width={50} height={50} />,
      name: <TextCommon className={cn('InfoName')} fs="14" />,
      status: <TextCommon className={cn('OnlineStatus')} fs="10" />,
    }

    if (!apiData) return byDefault

    const { type, title, participants, img: picture } = apiData

    switch (type) {
      case SelectDialogType.PRIVATE: {
        const [participant] = participants.filter(({ id }) => id !== profile?.userInfo.id)

        return ({
          img: <ImageCommon src={participant.profileImage} alt="contact" width={50} height={50} />,
          name: (
            <TextCommon className={cn('InfoName')} fs="14">
              {participant.name}
            </TextCommon>
          ),
          status: (
            <TextCommon className={cn('OnlineStatus')} fs="10">
              {participant.onlineStatus}
            </TextCommon>
          ),
        })
      }
      case SelectDialogType.PUBLIC: {
        return ({
          img: <ImageCommon src={picture} alt="contact" width={50} height={50} />,
          name: (
            <TextCommon className={cn('InfoName')} fs="14">
              {title}
            </TextCommon>
          ),
          status: (
            <TextCommon className={cn('OnlineStatus')} fs="10">
              {`${participants.length} участников,
              ${participants.filter(({ onlineStatus }) => onlineStatus === 'online').length} в сети`}
            </TextCommon>
          ),
        })
      }
      default: return byDefault
    }
  })

  if (apiStatus) return <SpinnerBase />
  if (apiError) return <div>Error</div>

  return (
    <div className={classNames(cn('ContactInfo'), className)}>
      <div className={cn('ImgContainer')}>{img}</div>
      <div className={cn('Info')}>
        <TextCommon className={cn('InfoName')} fs="14">{name}</TextCommon>
        <TextCommon className={cn('OnlineStatus')} fs="10">{status}</TextCommon>
      </div>
    </div>
  )
}
