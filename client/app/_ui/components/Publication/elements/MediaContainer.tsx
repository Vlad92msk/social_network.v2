import { size } from 'lodash'
import { MediaEntity } from '../../../../../../swagger/media/interfaces-media'
import { MediaAudio } from './MediaAudio'
import { MediaContent } from './MediaContent'
import { MediaOther } from './MediaOther'
import { cn } from '../cn'

interface MediaContainerProps {
  audio: MediaEntity[]
  video: MediaEntity[]
  image: MediaEntity[]
  other: MediaEntity[]
}

export function MediaContainer(props: MediaContainerProps) {
  const { audio, other, image, video } = props

  return (
    <div className={cn('MediaContainer')}>
      {size(image) && <MediaContent type="image" data={image} />}
      {size(video) && <MediaContent type="video" data={video} />}
      {size(audio) && (<MediaAudio data={audio} />)}
      {size(other) && (<MediaOther data={other} />)}
    </div>
  )
}
