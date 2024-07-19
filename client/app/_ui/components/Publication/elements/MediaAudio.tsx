import { useState } from 'react'
import { setImmutable } from '@utils/others'
import { MediaElement } from './MediaElement'
import { cn } from '../cn'
import { useReset } from '../hooks'
import { usePublicationCtxUpdate } from '../Publication'

interface Audio {
  type: string
  src: string
  name: string
}

interface MediaAudioProps {
  audios: Audio[]
}

export function MediaAudio(props: MediaAudioProps) {
  const { audios } = props
  const handleSetChangeActive = usePublicationCtxUpdate()

  const [usingData, setUsingData] = useState(audios)

  const handleRemove = (data) => {
    setUsingData((prev) => {
      const result = prev.filter((i) => i.src !== data.src)
      handleSetChangeActive((ctx) => setImmutable(ctx, 'changeState.media.audio', result))
      return result
    })
  }
  useReset('media.audio', audios, setUsingData)

  if (!usingData) return null
  return (
    <div className={cn('MediaContainerAudioList')}>
      {usingData.map((item) => (
        <MediaElement
          key={item.src}
          data={item}
          element={(data) => (
            <audio key={data.src} controls>
              <source src={data.src} type={data.type} />
              Your browser does not support the audio element.
            </audio>
          )}
          onRemove={handleRemove}
        />
      ))}
    </div>
  )
}
