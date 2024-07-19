import { useEffect, useState } from 'react'
import { useBooleanState } from '@hooks'
import { setImmutable } from '@utils/others'
import { ModalBase, ModalOverlay } from 'app/_ui/common/Modal'
import { Text } from 'app/_ui/common/Text'
import { MediaElement } from './MediaElement'
import { cn } from '../cn'
import { usePublicationCtxSelect, usePublicationCtxUpdate } from '../Publication'

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
  const handleSetChangeActive = usePublicationCtxUpdate()
  const status = usePublicationCtxSelect((store) => (store.status))

  const [getImages, setImages] = useState(images)
  const { current = [], other = [] } = Object.groupBy(getImages, (item, indx) => (indx <= 3 ? 'current' : 'other'))
  const [open, handleOpen, handleClose] = useBooleanState(false)

  const handleRemove = (data: any) => {
    setImages((prev) => {
      const result = prev.filter((i) => i.src !== data.src)
      handleSetChangeActive((ctx) => setImmutable(ctx, 'changeState.media.image', result))
      return result
    })
  }

  useEffect(() => {
    if (status === 'reset') {
      setImages(images)
      handleSetChangeActive((ctx) => setImmutable(ctx, 'changeState.media.image', images))
    }
  }, [handleSetChangeActive, images, status])

  if (current.length === 0) return null
  return (
    <div className={cn('MediaContainerImgList')}>
      <div className={cn('MediaContainerImgFirstCurrentList')}>
        {
          current.length === 1 ? (
            <MediaElement
              data={current}
              element={(data) => <img src={data[0].src} alt={data[0].name} style={{ maxHeight: 'inherit' }} />}
              onRemove={(data) => handleRemove(data[0])}
            />
          )
            : current.map((img) => (
              <MediaElement
                key={img.src}
                data={img}
                element={({ src, name }) => <img src={src} alt={name} style={{ maxHeight: 'inherit' }} />}
                onRemove={handleRemove}
              />
            ))
        }
      </div>
      {Boolean(other.length) && (
        <button className={cn('MediaContainerImgAddOtherButton')} onClick={handleOpen}>
          <Text>{`+ ${other.length}`}</Text>
        </button>
      )}
      <ModalBase isOpen={open} contentClassName={cn('MediaContainerOtherImgContent')}>
        <ModalOverlay onClick={handleClose} />
        {other.map((img) => (
          <MediaElement
            key={img.src}
            data={img}
            element={({ src, name }) => <img src={src} alt={name} style={{ maxHeight: 'inherit' }} />}
            onRemove={handleRemove}
          />
        ))}
      </ModalBase>
    </div>
  )
}
