import { MediaAudio } from './MediaAudio'
import { MediaImages } from './MediaImages'
import { MediaOther } from './MediaOther'
import { MediaVideo } from './MediaVideo'
import { cn } from '../cn'

export interface Media111 {
  image: []
  audio: []
  video: []
  text: []
  other: []
}

interface MediaContainerProps {
  image?: []
  audio?: []
  video?: []
  text?: []
  other?: []
}

export function MediaContainer(props: MediaContainerProps) {
  const { audio, text, other, image, video } = props

  if (![audio, text, other, image, video].filter(Boolean).every((m) => m?.length)) return null
  return (
    <div className={cn('MediaContainer')}>
      {image && (<MediaImages images={image} />)}
      {video && (<MediaVideo videos={video} />)}
      {audio && (<MediaAudio audios={audio} />)}
      {(other || text) && (<MediaOther files={[...(other || []), ...(text || [])]} />)}
    </div>
  )
}
