import { useBooleanState } from '@hooks'
import { ModalBase, ModalOverlay } from '@ui/base/Modal'
import { TextCommon } from '@ui/common/TextCommon'
import { cn } from '../cn'

interface Video {
  type: string
  src: string
  name: string
}

interface MediaVideoProps {
  videos: Video[]
}

export function MediaVideo(props: MediaVideoProps) {
  const { videos } = props
  const {
    current = [],
    other = []
  } = Object.groupBy(videos, (item, indx) => (indx <= 3 ? 'current' : 'other'))
  const [open, handleOpen, handleClose] = useBooleanState(false)
  return (
    <div className={cn('MediaContainerImgList')}>
      {Boolean(other.length) && (
        <button className={cn('MediaContainerImgAddOtherButton')} onClick={handleOpen}>
          <TextCommon fs="14">{`+ ${other.length}`}</TextCommon>
        </button>
      )}
      <div className={cn('MediaContainerImgFirstCurrentList')}>
        {
          current.length === 1 ? (
              <div className={cn('MediaContainerImgBox')}>
                <video controls>
                  <source src={current[0].src} type={current[0].type}/>
                  Your browser does not support the video element.
                </video>
              </div>
            ) :
            current.map(({ src, type }) => (
              <div key={src} className={cn('MediaContainerImgBox')}>
                <video controls>
                  <source src={src} type={type}/>
                  Your browser does not support the video element.
                </video>
              </div>
            ))
        }
      </div>
      <ModalBase isOpen={open} contentClassName={cn('MediaContainerOtherImgContent')}>
        <ModalOverlay onClick={handleClose}/>
        {other.map(({ src, type }) => (
          <div key={src} className={cn('MediaContainerImgBox')}>
            <video controls>
              <source src={src} type={type}/>
              Your browser does not support the video element.
            </video>
          </div>
        ))}
      </ModalBase>
    </div>
  )
}
