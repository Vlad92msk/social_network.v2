import { uniq } from 'lodash'
import { useCallback, useMemo, useState } from 'react'
import { useBooleanState } from '@hooks'
import { Modal } from 'app/_ui/common/Modal'
import { Text } from 'app/_ui/common/Text'
import { MediaElement } from './MediaElement'
import { MediaEntity } from '../../../../../../swagger/media/interfaces-media'
import { cn } from '../cn'
import { useReset } from '../hooks'
import { usePublicationCtxUpdate } from '../Publication'

interface MediaImagesProps {
  data?: MediaEntity[]
  type: 'image' | 'video'
}

export function MediaContent(props: MediaImagesProps) {
  const { data = [], type } = props
  const handleSetChangeActive = usePublicationCtxUpdate()

  const [usingData, setUsingData] = useState<MediaEntity[]>(data)
  const { current = [], other = [] } = Object.groupBy(usingData, (item, indx) => (indx <= 3 ? 'current' : 'other'))
  const [open, handleOpen, handleClose] = useBooleanState(false)

  const handleRemove = useCallback((removeMedia: MediaEntity) => {
    setUsingData((prev) => {
      const result = prev.filter((i) => i.id !== removeMedia.id)
      handleSetChangeActive((ctx) => ({
        ...ctx,
        changeState: {
          media: {
            ...(ctx.changeState?.media || {}),
            [type]: result,
          },
          removeMediaIds: uniq([...(ctx.changeState?.removeMediaIds || []), removeMedia.id]),
        },
      }))
      return result
    })
  }, [handleSetChangeActive, type])

  useReset<MediaEntity[]>(`media.${type}`, data, setUsingData)

  const element = useMemo(() => {
    switch (type) {
      case 'video':
        // eslint-disable-next-line react/no-unstable-nested-components
        return function ({ meta }: MediaEntity) {
          return (
            <video controls>
              <source src={meta.src} type={meta.mimeType} />
              Your browser does not support the video element.
            </video>
          )
        }
      case 'image':
        // eslint-disable-next-line react/no-unstable-nested-components
        return function ({ meta }: MediaEntity) {
          return <img src={meta.src} alt={meta.name} style={{ maxHeight: 'inherit' }} />
        }
      default: return () => <></>
    }
  }, [type])

  if (current.length === 0) return null
  return (
    <div className={cn('MediaContainerImgList')}>
      <div className={cn('MediaContainerImgFirstCurrentList')}>
        {current.map((img) => (
          <MediaElement
            key={img.meta.src}
            data={img}
            element={element}
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
            key={img.meta.src}
            data={img}
            element={element}
            onRemove={handleRemove}
          />
        ))}
      </Modal>
    </div>
  )
}
