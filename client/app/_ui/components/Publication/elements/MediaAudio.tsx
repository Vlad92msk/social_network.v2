import { uniq } from 'lodash'
import { MediaEntity } from '../../../../../../swagger/media/interfaces-media'
import { useCallback, useState } from 'react'
import { MediaElement } from './MediaElement'
import { cn } from '../cn'
import { useReset } from '../hooks'
import { usePublicationCtxUpdate } from '../Publication'


interface MediaAudioProps {
  data: MediaEntity[]
}

export function MediaAudio(props: MediaAudioProps) {
  const { data } = props
  const handleSetChangeActive = usePublicationCtxUpdate()

  const [usingData, setUsingData] = useState(data)

  const handleRemove = useCallback((removeMedia: MediaEntity) => {
    setUsingData((prev) => {
      const result = prev.filter((i) => i.id !== removeMedia.id)
      handleSetChangeActive((ctx) => ({
        ...ctx,
        changeState: {
          media: {
            ...(ctx.changeState?.media || {}),
            audio: result,
          },
          removeMediaIds: uniq([...(ctx.changeState?.removeMediaIds || []), removeMedia.id]),
        },
      }))
      return result
    })
  }, [handleSetChangeActive])

  useReset('media.audio', data, setUsingData)

  if (!usingData) return null
  return (
    <div className={cn('MediaContainerAudioList')}>
      {usingData.map((item) => (
        <MediaElement
          key={item.id}
          data={item}
          element={(data) => (
            <audio key={data.meta.src} controls>
              <source src={data.meta.src} type={data.meta.mimeType} />
              Your browser does not support the audio element.
            </audio>
          )}
          onRemove={handleRemove}
        />
      ))}
    </div>
  )
}
