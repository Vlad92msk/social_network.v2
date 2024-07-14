import { MediaAudio } from '@ui/components/Publication/elements/MediaAudio'
import { MediaImages } from '@ui/components/Publication/elements/MediaImages'
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
      <MediaAudio audios={media.audio} />
    </div>
  )
}
