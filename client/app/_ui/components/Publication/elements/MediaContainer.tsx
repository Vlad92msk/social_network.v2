import { isEmpty } from 'lodash'
import { MediaEntity } from '../../../../../../swagger/media/interfaces-media'
import { MediaAudio } from './MediaAudio'
import { MediaContent } from './MediaContent'
import { MediaOther } from './MediaOther'
import { cn } from '../cn'

interface MediaContainerProps {
  audio: MediaEntity[]
  voices: MediaEntity[]
  video: MediaEntity[]
  image: MediaEntity[]
  other: MediaEntity[]
}

export function MediaContainer(props: MediaContainerProps) {
  const { audio, other, image, video, voices } = props

  return (
    <div className={cn('MediaContainer')}>
      {!isEmpty(image) && <MediaContent type="image" data={image} />}
      {!isEmpty(video) && <MediaContent type="video" data={video} />}
      {!isEmpty(audio) && (<MediaAudio type="audio" data={audio} />)}
      {!isEmpty(voices) && (<MediaAudio type="voices" data={voices} />)}
      {!isEmpty(other) && (<MediaOther data={other} />)}
    </div>
  )
}
