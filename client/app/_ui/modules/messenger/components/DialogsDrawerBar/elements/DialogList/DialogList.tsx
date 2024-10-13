import { selectDrawerStatus } from '@ui/modules/messenger/store/selectors/messenger.selectors'
import { useDispatch, useSelector } from 'react-redux'
import { MessengerThunkActions } from '@ui/modules/messenger/store/actions'
import { MessengerSliceActions } from '@ui/modules/messenger/store/messenger.slice'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { classNames } from '@utils/others'
import { Button } from 'app/_ui/common/Button'
import { Image } from 'app/_ui/common/Image'
import { Text } from 'app/_ui/common/Text'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'

interface DialogListProps{
  className?: string;
}

export function DialogList(props: DialogListProps) {
  const { className } = props
  const dispatch = useDispatch()

  const viewDialogList = useSelector(MessengerSelectors.selectDialogList)
  const drawerStatus = useSelector(MessengerSelectors.selectDrawerStatus)

  const [onRemoveDialog] = dialogsApi.useRemoveMutation()
  const [onLeaveDialog] = dialogsApi.useLeaveDialogMutation()

  return (
    <div className={classNames(cn({ status: drawerStatus }), className)}>
      <Text fs="12">Мои диалоги</Text>
      {viewDialogList?.map(({
        type,
        image,
        title,
        last_message,
        id,
      }) => (
        <div key={id} className={cn('Contact')}>
          <div className={cn('ContactImgContainer')}>
            <Image src={image} alt={title || ''} width="50" height="50" />
          </div>
          <div className={cn('ContactContentWrapper')}>
            {type === 'public' && (
              <Text className={cn('ContactName')} fs="12" textElipsis>{title}</Text>
            )}
            <Text className={cn('ContactLastContactName')} fs="12" textElipsis>{last_message?.author?.name}</Text>
            <Text className={cn('ContactLastMessage')} fs="12" textElipsis>{last_message?.text}</Text>
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
            {/* <Button> */}
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
