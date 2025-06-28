import { Image } from '@ui/common/Image'
import { MediaMetadata } from '../../../../../swagger/media/interfaces-media'
import { mediaApi } from '../../../../store/api'

interface MediaItemElementProps {
  type?: MediaMetadata['type']
  className?: string
  metadata?: MediaMetadata
  mediaInfoId?: string
}

export function MediaItemElement(props: MediaItemElementProps) {
  const {
    type,
    metadata,
    mediaInfoId,
    className,
  } = props

  if (!metadata || !type) return null

  const [onDeleteMedia] = mediaApi.useDeleteFileMutation()

  /**
   * TODO: переделать потом
   * Пока просто чтоб была кнопка удаления
   */
  const buttonRemove = (
    <button onClick={(event) => {
      event.preventDefault()
      event.stopPropagation()
      if (mediaInfoId) {
        onDeleteMedia({ id: mediaInfoId })
      }
    }}
    >
      Удалить
    </button>
  )

  switch (type) {
    case 'video' || 'shorts':
      // eslint-disable-next-line react/no-unstable-nested-app-components
      return (
        <>
          {buttonRemove}
          <video controls>
            <source src={metadata.src} type={metadata.mimeType}/>
            Your browser does not support the video element.
          </video>
        </>
      )

    case 'image':
      // eslint-disable-next-line react/no-unstable-nested-app-components
      return (
        <>
          {buttonRemove}
          <Image width={400} height={400} alt={metadata.name} src={metadata.src} style={{ maxHeight: 'inherit' }} />
        </>
      )

    case 'audio' || 'voice':
      return (
        <>
          {buttonRemove}
          <audio key={metadata.src} controls>
            <source src={metadata.src} type={metadata.mimeType}/>
            Your browser does not support the audio element.
          </audio>
        </>
      )

    default:
      return null
  }
}
