import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useProfile } from '@hooks'
import { classNames } from '@utils/others'
import { Image } from 'app/_ui/common/Image'
import { Text } from 'app/_ui/common/Text'
import { cn } from './cn'
import { SelectDialogType } from '../../../../store/slices/dialogList.slice'

interface ContactInfoProps {
  className?: string
}

export function ContactInfo(props: ContactInfoProps) {
  const { className } = props
  const { profile } = useProfile()
  const selectUser = useSelector(MessengerSelectors.selectTargetNewUserToDialog)
  const currentDialog = useSelector(MessengerSelectors.selectCurrentDialog)

  const { status, name, img } = useMemo(() => {
    if (selectUser) {
      return ({
        img: <Image src={selectUser?.profile_image} alt={selectUser?.name} width={50} height={50} />,
        name: (
          <Text className={cn('InfoName')} fs="14">
            {selectUser.name}
          </Text>
        ),
        status: (
          <Text className={cn('OnlineStatus')} fs="10">
            online!
          </Text>
        ),
      })
    }

    const byDefault = {
      img: <Image alt="contact" width={50} height={50} />,
      name: <Text className={cn('InfoName')} fs="14" />,
      status: <Text className={cn('OnlineStatus')} fs="10" />,
    }

    if (!currentDialog) return byDefault

    const { type, participants, image, title } = currentDialog
    switch (type) {
      case SelectDialogType.PRIVATE: {
        const [participant] = participants.filter(({ id }) => id !== profile?.user_info.id)

        return ({
          img: <Image src={participant.profile_image} alt={participant.name} width={50} height={50} />,
          name: (
            <Text className={cn('InfoName')} fs="14">
              {participant.name}
            </Text>
          ),
          status: (
            <Text className={cn('OnlineStatus')} fs="10">
              {participant.status}
            </Text>
          ),
        })
      }
      case SelectDialogType.PUBLIC: {
        return ({
          img: <Image src={image} alt="contact" width={50} height={50} />,
          name: (
            <Text className={cn('InfoName')} fs="14">
              {title}
            </Text>
          ),
          status: (
            <Text className={cn('OnlineStatus')} fs="10">
              {`${participants.length} участников,
              ${participants.filter(({ status: userStatus }) => userStatus === 'online').length} в сети`}
            </Text>
          ),
        })
      }
      default: return byDefault
    }
  }, [currentDialog, profile, selectUser])

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
