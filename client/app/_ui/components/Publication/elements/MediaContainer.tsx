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
  media?: Media111
}

export function MediaContainer(props: MediaContainerProps) {
  const { media } = props

  if (!media) return null
  return (
    <div className={cn('MediaContainer')}>
      <MediaImages images={media.image} />
      <MediaVideo videos={media.video} />
      <MediaAudio audios={media.audio} />
      <MediaOther files={[...media.other, ...media.text]} />
    </div>
  )
}
