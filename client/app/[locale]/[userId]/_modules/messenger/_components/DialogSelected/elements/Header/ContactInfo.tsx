import { SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'
import { useProfile } from '@hooks'
import { Spinner } from '@ui/common/Spinner'
import { classNames } from '@utils/others'
import { Image } from 'app/_ui/common/Image'
import { Text } from 'app/_ui/common/Text'
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
      img: <Image alt="contact" width={50} height={50} />,
      name: <Text className={cn('InfoName')} fs="14" />,
      status: <Text className={cn('OnlineStatus')} fs="10" />,
    }

    if (!apiData) return byDefault

    const { type, title, participants, img: picture } = apiData

    switch (type) {
      case SelectDialogType.PRIVATE: {
        const [participant] = participants.filter(({ id }) => id !== profile?.userInfo.id)

        return ({
          img: <Image src={participant.profileImage} alt="contact" width={50} height={50} />,
          name: (
            <Text className={cn('InfoName')} fs="14">
              {participant.name}
            </Text>
          ),
          status: (
            <Text className={cn('OnlineStatus')} fs="10">
              {participant.onlineStatus}
            </Text>
          ),
        })
      }
      case SelectDialogType.PUBLIC: {
        return ({
          img: <Image src={picture} alt="contact" width={50} height={50} />,
          name: (
            <Text className={cn('InfoName')} fs="14">
              {title}
            </Text>
          ),
          status: (
            <Text className={cn('OnlineStatus')} fs="10">
              {`${participants.length} участников,
              ${participants.filter(({ onlineStatus }) => onlineStatus === 'online').length} в сети`}
            </Text>
          ),
        })
      }
      default: return byDefault
    }
  })

  if (apiStatus) return <Spinner />
  if (apiError) return <div>Error</div>

  return (
    <div className={classNames(cn('ContactInfo'), className)}>
      <div className={cn('ImgContainer')}>{img}</div>
      <div className={cn('Info')}>
        <Text className={cn('InfoName')} fs="14">{name}</Text>
        <Text className={cn('OnlineStatus')} fs="10">{status}</Text>
      </div>
    </div>
  )
}
