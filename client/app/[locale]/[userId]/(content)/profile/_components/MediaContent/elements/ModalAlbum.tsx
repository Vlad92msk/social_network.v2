import { Modal } from '@ui/common/Modal'
import { MediaResponseDto } from '../../../../../../../../../swagger/media/interfaces-media'
import { cn } from '../cn'
import { ItemElement } from './ItemElement'

interface ModalAlbumProps {
  isAlbumOpen: boolean
  onClose: VoidFunction
  items: MediaResponseDto[]
}

export function ModalAlbum(props: ModalAlbumProps) {
  const { isAlbumOpen, onClose, items } = props

  return (
    <Modal contentClassName={cn('ModalAlbum')} isOpen={isAlbumOpen} showOverlay onClose={onClose}>
      <div className={cn('ModalAlbumListItems')}>
        {items.map((item) => (
          <ItemElement key={item.id} item={item} />
        ))}
      </div>
    </Modal>
  )
}
