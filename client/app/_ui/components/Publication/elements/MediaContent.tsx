import { useState } from 'react'
import { useBooleanState } from '@hooks'
import { setImmutable } from '@utils/others'
import { Modal } from 'app/_ui/common/Modal'
import { Text } from 'app/_ui/common/Text'
import { MediaElement } from './MediaElement'
import { cn } from '../cn'
import { useReset } from '../hooks'
import { usePublicationCtxUpdate } from '../Publication'

interface MediaImagesProps <Data extends Record<'src' | 'type' | 'name', any>[]> {
  data?: Data
  type: 'image' | 'video'
}

export function MediaContent<Data extends Record<'src' | 'type' | 'name', any>[]>(props: MediaImagesProps<Data>) {
  const { data = [], type } = props
  const handleSetChangeActive = usePublicationCtxUpdate()
console.log('data', data)
  // @ts-ignore
  const [usingData, setUsingData] = useState<Data>(data)
  const { current = [], other = [] } = Object.groupBy(usingData, (item, indx) => (indx <= 3 ? 'current' : 'other'))
  const [open, handleOpen, handleClose] = useBooleanState(false)

  const handleRemove = (data: Data[0]) => {
    // @ts-ignore
    setUsingData((prev) => {
      const result = prev.filter((i) => i.src !== data.src)
      handleSetChangeActive((ctx) => setImmutable(ctx, `changeState.media.${type}`, result))
      return result
    })
  }

  // @ts-ignore
  useReset<Data>(`media.${type}`, data, setUsingData)

  const element = () => {
    switch (type) {
      case 'video':
        return function (data: Data[0]) {
          return (
            <video controls>
              <source src={data.src} type={data.type} />
              Your browser does not support the video element.
            </video>
          )
        }
      case 'image':
        return function (data: Data[0]) {
          return <img src={data.src} alt={data.name} style={{ maxHeight: 'inherit' }} />
        }
    }
  }

  if (current.length === 0) return null
  return (
    <div className={cn('MediaContainerImgList')}>
      <div className={cn('MediaContainerImgFirstCurrentList')}>
        {current.map((img) => (
          <MediaElement
            key={img.src}
            data={img}
            element={element()}
            onRemove={handleRemove}
          />
        ))}
      </div>
      {Boolean(other.length) && (
        <button className={cn('MediaContainerImgAddOtherButton')} onClick={handleOpen}>
          <Text>{`+ ${other.length}`}</Text>
        </button>
      )}
      <Modal isOpen={open} contentClassName={cn('MediaContainerOtherImgContent')} onClose={handleClose}>
        {other.map((img) => (
          <MediaElement
            key={img.src}
            data={img}
            element={element()}
            onRemove={handleRemove}
          />
        ))}
      </Modal>
    </div>
  )
}
