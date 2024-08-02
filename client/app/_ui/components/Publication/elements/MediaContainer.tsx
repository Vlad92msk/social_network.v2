import { MediaAudio } from './MediaAudio'
import { MediaContent } from './MediaContent'
import { MediaOther } from './MediaOther'
import { PublicationMediaDTO } from '../../../../types/publicationDTO'
import { cn } from '../cn'

export function MediaContainer(props: Partial<PublicationMediaDTO>) {
  const { audio, text, other, image, video } = props

  if (![audio, text, other, image, video].filter(Boolean).some((m) => m?.length)) return null

  return (
    <div className={cn('MediaContainer')}>
      {image && <MediaContent type="image" data={image} />}
      {video && <MediaContent type="video" data={video} />}
      {audio && (<MediaAudio audios={audio} />)}
      {(other || text) && (<MediaOther files={[...(other || []), ...(text || [])]} />)}
    </div>
  )
}
