import { Image } from '@components/ui'
import { userMediaSynapse } from '@store/synapses/user-media'

import { MediaMetadata } from '../../../../../swagger/media/interfaces-media'

const { actions } = userMediaSynapse

interface MediaItemElementProps {
  type?: MediaMetadata['type']
  className?: string
  metadata?: MediaMetadata
  mediaInfoId?: string
}

export function MediaItemElement(props: MediaItemElementProps) {
  const { type, metadata, mediaInfoId, className } = props

  if (!metadata || !type) return null

  /**
   * TODO: переделать потом
   * Пока просто чтоб была кнопка удаления
   */
  const buttonRemove = (
    <button
      onClick={async (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (mediaInfoId) {
          await actions.deleteMediaInit({ id: mediaInfoId })
        }
      }}
    >
      Удалить
    </button>
  )

  switch (type) {
    case 'video':
    case 'shorts':
      return (
        <>
          {buttonRemove}
          <video controls>
            <source src={metadata.src} type={metadata.mimeType} />
            Your browser does not support the video element.
          </video>
        </>
      )

    case 'image':
      return (
        <>
          {buttonRemove}
          <Image width={400} height={400} alt={metadata.name} src={metadata.src} style={{ maxHeight: 'inherit' }} />
        </>
      )

    case 'audio':
    case 'voice':
      return (
        <>
          {buttonRemove}
          <audio key={metadata.src} controls>
            <source src={metadata.src} type={metadata.mimeType} />
            Your browser does not support the audio element.
          </audio>
        </>
      )

    default:
      return null
  }
}
