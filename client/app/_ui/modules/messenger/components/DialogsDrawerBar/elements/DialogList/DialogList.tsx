import { useParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { Locale } from '@middlewares/variables'
import { editorStateFromString, editorStateToPlainText } from '@ui/common/Input/hooks'
import { Spinner } from '@ui/common/Spinner'
import { MessengerThunkActions } from '@ui/modules/messenger/store/actions'
import { MessengerSliceActions } from '@ui/modules/messenger/store/messenger.slice'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { classNames } from '@utils/others'
import { Button } from 'app/_ui/common/Button'
import { Image } from 'app/_ui/common/Image'
import { Text } from 'app/_ui/common/Text'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'
import { ProfileSelectors } from '../../../../../../../../store/profile.slice'

interface DialogListProps{
  className?: string;
}

export function DialogList(props: DialogListProps) {
  const { className } = props
  const { locale, userId } = useParams<{locale: Locale, userId: string}>()
  const router = useRouter()
  const dispatch = useDispatch()
  const { profile } = useSelector(ProfileSelectors.selectProfile)
  const activeConference = useSelector(MessengerSelectors.selectActiveConference)
  const dialogType = useSelector(MessengerSelectors.selectSelectType)

  const drawerStatus = useSelector(MessengerSelectors.selectDrawerStatus)

  const { data: viewDialogList, isLoading } = dialogsApi.useFindByUserShortDialogQuery(
    { userId: profile?.user_info.id as number },
    { skip: !profile?.user_info.id },
  )
  const [onRemoveDialog] = dialogsApi.useRemoveMutation()
  const [onLeaveDialog] = dialogsApi.useLeaveDialogMutation()

  return (
    <div className={classNames(cn({ status: drawerStatus }), className)}>
      {/* <Text fs="12">Мои диалоги</Text> */}
      {isLoading ? <Spinner /> : viewDialogList?.filter(({ type }) => type === dialogType)?.map(({
        type,
        image,
        title,
        last_message,
        id,
      }) => (
        <div key={id} className={cn('Contact', { activeCall: activeConference[id] })}>
          <div className={cn('ContactImgContainer')}>
            <Image src={image} alt={title || ''} width="50" height="50" />
          </div>
          <div className={cn('ContactContentWrapper')}>
            {title && (
              <Text className={cn('ContactName')} fs="12" weight="medium" textElipsis letterSpacing={0.1}>{title}</Text>
            )}
            <Text className={cn('ContactLastContactName')} fs="12" weight="bold" textElipsis>{last_message?.author?.name}</Text>
            <Text className={cn('ContactLastMessage')} fs="12" textElipsis>
              {editorStateToPlainText(editorStateFromString(last_message?.text))}
            </Text>
          </div>
          <div className={cn('ContactHoverActions')}>
            <Button onClick={() => {
              dispatch(MessengerSliceActions.setChattingPanelStatus('open'))
              dispatch(MessengerThunkActions.joinToDialog(id))
              dispatch(MessengerSliceActions.setCurrentDialogId(id))
            }}
            >
              <Text fs="12">Чат</Text>
            </Button>
            {/* <Button onClick={() => {router.push(`/${locale}/${participant.public_id}/profile`)}}> */}
            {/*   <Text fs="12">К контакту</Text> */}
            {/* </Button> */}
            <Button onClick={() => {
              onRemoveDialog({ id })
            }}
            >
              <Text fs="12">Удалить</Text>
            </Button>
            <Button onClick={() => {
              onLeaveDialog({ id })
            }}
            >
              <Text fs="12">Покинуть</Text>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
