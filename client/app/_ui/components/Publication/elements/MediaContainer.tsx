import { MediaAudio } from './MediaAudio'
import { MediaImages } from './MediaImages'
import { MediaOther } from './MediaOther'
import { MediaVideo } from './MediaVideo'
import { cn } from '../cn'
import { usePublicationCtxSelect } from '../Publication'

export interface Media111 {
  image: []
  audio: []
  video: []
  text: []
  other: []
}


export function MediaContainer() {
  const media = usePublicationCtxSelect((store) => store.media)

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
