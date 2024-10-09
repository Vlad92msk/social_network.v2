import { MessengerSelectors } from '@ui/modules/messenger/store/messenger.slice'
import { useMemo } from 'react'
import { useProfile } from '@hooks'
import { Spinner } from '@ui/common/Spinner'
import { classNames } from '@utils/others'
import { Image } from 'app/_ui/common/Image'
import { Text } from 'app/_ui/common/Text'
import { useSelector } from 'react-redux'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'
import { useMessageStore } from '../../../../store'
import { SelectDialogType } from '../../../../store/slices/dialogList.slice'

interface ContactInfoProps {
  className?: string
}

export function ContactInfo(props: ContactInfoProps) {
  const { className } = props
  const { profile } = useProfile()
  const openDialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const isCreatable = useMessageStore((store) => store.isCreatable)
  const selectUser = useMessageStore((store) => store.selectUser)

  const { apiIsLoading, apiIsError, type, participants, title, image } = dialogsApi.useFindOneQuery(
    { id: openDialogId },
    {
      skip: !Boolean(openDialogId?.length),
      selectFromResult: ({ data, isLoading, isError }) => ({
        participants: data?.participants ?? [],
        title: data?.title,
        image: data?.image,
        type: data?.type,
        id: data?.id,
        apiIsLoading: isLoading,
        apiIsError: isError,
      }),
    },
  )

  const { status, name, img } = useMemo(() => {
    if (isCreatable && selectUser) {
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
  }, [image, isCreatable, participants, profile, selectUser, title, type])

  if (apiIsLoading) return <Spinner />
  if (apiIsError) return <div>Ошибка</div>

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
