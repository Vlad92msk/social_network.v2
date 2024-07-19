import { usePublicationCtxUpdate } from '../Publication'
import { MediaElement } from './MediaElement'
import { useReset } from '../hooks'
import { setImmutable } from '@utils/others'
import { useState } from 'react'
import { cn } from '../cn'

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
      handleSetChangeActive((ctx) => setImmutable(ctx, `changeState.media.audio`, result))
      return result
    })
  }
  useReset(`media.audio`, audios, setUsingData)

  return (
    <div className={cn('MediaContainerAudioList')}>
      {usingData.map((item) => (
        <MediaElement
          key={item.src}
          data={item}
          element={(data) => (
            <audio key={data.src} controls>
              <source src={data.src} type={data.type}/>
              Your browser does not support the audio element.
            </audio>
          )}
          onRemove={handleRemove}
        />
      ))}
    </div>
  )
}
