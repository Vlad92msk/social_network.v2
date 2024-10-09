import { useDispatch } from 'react-redux'
import { useProfile } from '@hooks'
import { MessengerSliceActions } from '@ui/modules/messenger/store/messenger.slice'
import { classNames } from '@utils/others'
import { Button } from 'app/_ui/common/Button'
import { Image } from 'app/_ui/common/Image'
import { Text } from 'app/_ui/common/Text'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'
import { useMessageStore } from '../../../../store'

interface DialogListProps{
  className?: string;
}

export function DialogList(props: DialogListProps) {
  const { className } = props
  const dispatch = useDispatch()
  const { profile } = useProfile()

  const drawerStatus = useMessageStore((state) => state.drawerStatus)
  const setChatingPanelStatus = useMessageStore((state) => state.setChatingPanelStatus)

  /**
   * Получаем краткие диалоги
   */
  const { data: viewDialogList } = dialogsApi.useFindByUserShortDialogQuery({
    userId: profile?.user_info.id as number,
  }, {
    skip: !profile?.user_info.id,
  })

  const [onGetDialog] = dialogsApi.useLazyFindOneQuery()
  const [onRemoveDialog] = dialogsApi.useRemoveMutation()
  const [onLeaveDialog] = dialogsApi.useLeaveDialogMutation()
  console.log('viewDialogList', viewDialogList)
  return (
    <div className={classNames(cn({ status: drawerStatus }), className)}>
      <Text fs="12">Мои диалоги</Text>
      {viewDialogList?.map(({
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
            <Text className={cn('ContactName')} fs="12" textElipsis>{title}</Text>
            <Text className={cn('ContactLastContactName')} fs="12" textElipsis>{last_message?.author?.name}</Text>
            <Text className={cn('ContactLastMessage')} fs="12" textElipsis>{last_message?.text}</Text>
          </div>
          <div className={cn('ContactHoverActions')}>
            <Button onClick={() => {
              console.log(`Открыл диалог с ID:${id}`)
              setChatingPanelStatus('open')
              onGetDialog({ id })
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
