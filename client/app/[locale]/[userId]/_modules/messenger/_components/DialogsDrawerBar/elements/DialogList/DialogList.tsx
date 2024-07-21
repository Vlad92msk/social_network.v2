import { SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'
import { classNames } from '@utils/others'
import { Button } from 'app/_ui/common/Button'
import { Image } from 'app/_ui/common/Image'
import { Text } from 'app/_ui/common/Text'
import { cn } from './cn'
import { useMessageStore } from '../../../../_store'

interface DialogListProps{
  className?: string;
}

export function DialogList(props: DialogListProps) {
  const { className } = props
  const viewDialogList = useMessageStore((state) => state.viewDialogList())
  const status = useMessageStore((state) => state.drawerStatus)
  const setChatingPanelStatus = useMessageStore((state) => state.setChatingPanelStatus)
  const setOpenedDialogIds = useMessageStore((state) => state.setOpenedDialogIds)

  return (
    <div className={classNames(cn({ status }), className)}>
      {viewDialogList.map(({
        img,
        title,
        type,
        description,
        lastMessage,
        id,
      }) => (
        <div key={id} className={cn('Contact')}>
          <div className={cn('ContactImgContainer')}>
            { type === SelectDialogType.PUBLIC ? (
              <Image src={img} alt={title || description || ''} width="50" height="50" />
            ) : (
              <Image src={lastMessage?.author?.profileImage} alt={lastMessage?.author?.name || ''} width="50" height="50" />
            ) }
          </div>
          <div className={cn('ContactContentWrapper')}>
            <Text className={cn('ContactName')} fs="12" textElipsis>{title}</Text>
            <Text className={cn('ContactLastContactName')} fs="12" textElipsis>{lastMessage?.text}</Text>
            <Text className={cn('ContactLastMessage')} fs="12" textElipsis>{lastMessage?.text}</Text>
          </div>
          <div className={cn('ContactHoverActions')}>
            <Button onClick={() => {
              console.log(`Открыл диалог с ID:${id}`)
              setChatingPanelStatus('open')
              setOpenedDialogIds([id])
            }}
            >
              <Text fs="12">Чат</Text>
            </Button>
            <Button>
              <Text fs="12">К контакту</Text>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
