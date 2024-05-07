import { SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'
import { ButtonCommon } from '@ui/common/ButtonCommon'
import { ImageCommon } from '@ui/common/ImageCommon'
import { TextCommon } from '@ui/common/TextCommon'
import { classNames } from '@utils/others'
import { cn } from './cn'
import { useDialogListStore } from '../../../../_providers/dialogList'
import { useRootStore } from '../../../../_providers/root'

interface DialogListProps{
  className?: string;
}

export function DialogList(props: DialogListProps) {
  const { className } = props
  const viewDialogList = useDialogListStore((state) => state.viewDialogList())
  const status = useRootStore((state) => state.drawerStatus)
  const setChatingPanelStatus = useRootStore((state) => state.setChatingPanelStatus)

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
              <ImageCommon src={img || 'base/blur_img'} alt={title || description || ''} width="50" height="50" />
            ) : (
              <ImageCommon src={lastMessage?.author?.profileImage || 'base/blur_img'} alt={lastMessage?.author?.name || ''} width="50" height="50" />
            ) }
          </div>
          <div className={cn('ContactContentWrapper')}>
            <TextCommon className={cn('ContactName')} fs="12" textElipsis>{title}</TextCommon>
            <TextCommon className={cn('ContactLastContactName')} fs="12" textElipsis>{lastMessage?.text}</TextCommon>
            <TextCommon className={cn('ContactLastMessage')} fs="12" textElipsis>{lastMessage?.text}</TextCommon>
          </div>
          <div className={cn('ContactHoverActions')}>
            <ButtonCommon onClick={() => {
              console.log(`Открыл диалог с ID:${id}`)
              setChatingPanelStatus('open')
            }}
            >
              <TextCommon fs="12">Чат</TextCommon>
            </ButtonCommon>
            <ButtonCommon>
              <TextCommon fs="12">К контакту</TextCommon>
            </ButtonCommon>
          </div>
        </div>
      ))}
    </div>
  )
}
