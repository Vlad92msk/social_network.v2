import { useBooleanState } from '@hooks'
import { ModalBase } from '@ui/base/Modal'
import { TextCommon } from '@ui/common/TextCommon'
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
      {other.length && (
        <button className={cn('MediaContainerImgAddOtherButton')} onClick={handleOpen}>
          <TextCommon fs="14">{`+ ${other.length}`}</TextCommon>
        </button>
      )}
      <div className={cn('MediaContainerImgFirstCurrentList')}>
        {
          current.map(({ type,
            src,
            name }) => (
              <div key={src} className={cn('MediaContainerImgBox')}>
                <img src={src} alt={name} style={{ maxHeight: 'inherit' }} />
              </div>
          ))
    }
      </div>
    </div>
  )
}
