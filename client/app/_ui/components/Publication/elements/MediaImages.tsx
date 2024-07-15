import { useBooleanState } from '@hooks'
import { ModalBase, ModalOverlay } from 'app/_ui/common/Modal'
import { Text } from 'app/_ui/common/Text'
import { cn } from '../cn'

interface Img {
  type: string
  src: string
  name: string
}

interface MediaImagesProps {
  images: Img[]
}

export function MediaImages(props: MediaImagesProps) {
  const { images } = props
  const { current = [], other = [] } = Object.groupBy(images, (item, indx) => (indx <= 3 ? 'current' : 'other'))
  const [open, handleOpen, handleClose] = useBooleanState(false)

  return (
    <div className={cn('MediaContainerImgList')}>
      <div className={cn('MediaContainerImgFirstCurrentList')}>
        {
          current.length === 1 ? (
              <div className={cn('MediaContainerImgBox')}>
                <img src={current[0].src} alt={current[0].name} style={{ maxHeight: 'inherit' }} />
              </div>
          ) :
          current.map(({ src, name }) => (
            <div key={src} className={cn('MediaContainerImgBox')}>
              <img src={src} alt={name} style={{ maxHeight: 'inherit' }} />
            </div>
          ))
        }
      </div>
      {Boolean(other.length) && (
        <button className={cn('MediaContainerImgAddOtherButton')} onClick={handleOpen}>
          <Text fs="14">{`+ ${other.length}`}</Text>
        </button>
      )}
      <ModalBase isOpen={open} contentClassName={cn('MediaContainerOtherImgContent')}>
        <ModalOverlay onClick={handleClose} />
          {other.map(({ src, name }) => (
            <div key={src} className={cn('MediaContainerImgBox')}>
              <img src={src} alt={name} style={{ maxHeight: 'inherit' }} />
            </div>
          ))}
      </ModalBase>
    </div>
  )
}
