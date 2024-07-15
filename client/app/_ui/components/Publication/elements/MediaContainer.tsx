import { MediaOther } from './MediaOther'
import { MediaAudio } from './MediaAudio'
import { MediaImages } from './MediaImages'
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
  console.log('media', media)

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
