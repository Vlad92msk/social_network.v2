import { useEffect } from 'react'
import { SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'
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
  const viewDialogList = useMessageStore((state) => state.viewDialogList())
  const drawerStatus = useMessageStore((state) => state.drawerStatus)
  const setChatingPanelStatus = useMessageStore((state) => state.setChatingPanelStatus)
  const setOpenDialogId = useMessageStore((state) => state.setOpenDialogId)
  const [onGetDialog] = dialogsApi.useLazyFindOneQuery()

  return (
    <div className={classNames(cn({ status: drawerStatus }), className)}>
      {viewDialogList.map(({
        image,
        title,
        type,
        last_message,
        id,
      }) => (
        <div key={id} className={cn('Contact')}>
          <div className={cn('ContactImgContainer')}>
            { type === SelectDialogType.PUBLIC ? (
              <Image src={image} alt={title || ''} width="50" height="50" />
            ) : (
              <Image src={last_message?.author?.profile_image} alt={last_message?.author?.name || ''} width="50" height="50" />
            ) }
          </div>
          <div className={cn('ContactContentWrapper')}>
            <Text className={cn('ContactName')} fs="12" textElipsis>{title}</Text>
            <Text className={cn('ContactLastContactName')} fs="12" textElipsis>{last_message?.text}</Text>
            <Text className={cn('ContactLastMessage')} fs="12" textElipsis>{last_message?.text}</Text>
          </div>
          <div className={cn('ContactHoverActions')}>
            <Button onClick={() => {
              console.log(`Открыл диалог с ID:${id}`)
              setChatingPanelStatus('open')
              onGetDialog({ id })
              setOpenDialogId(id)
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
