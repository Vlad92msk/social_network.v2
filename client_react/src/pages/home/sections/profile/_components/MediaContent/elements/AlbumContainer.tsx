import { Text } from '@components/ui'
import { SortableContext } from '@dnd-kit/sortable'
import { useBooleanState } from '@hooks'

import { MediaResponseDto } from '../../../../../../../../../swagger/media/interfaces-media'
import { cn } from '../cn'
import { AlbumTitle } from './AlbumTitle'
import { ModalAlbum } from './ModalAlbum'
import { SortableItem } from './SortableItem'

interface AlbumContainerProps {
  title: string
  albumItems: MediaResponseDto[]
  overItemId: string | null
}

export function AlbumContainer(props: AlbumContainerProps) {
  const { title, albumItems, overItemId } = props
  const [isAlbumOpen, onAlbumOpen, onAlbumClose] = useBooleanState(false)
  const [preview, other] = albumItems.reduce(
    (acc, el, indx) => {
      if (indx <= 3) {
        acc[0].push(el)
      } else {
        acc[1].push(el)
      }

      return acc
    },
    [[] as MediaResponseDto[], [] as MediaResponseDto[]],
  )

  return (
    <div
      className={cn('AlbumContainer', {
        active: albumItems.some((item) => item.id === overItemId),
      })}
    >
      <SortableContext items={albumItems}>
        <div
          className={cn('PhotosContainer', { isAlbum: true })}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            console.log(`Нажали на альбом ${title}`)
            onAlbumOpen()
          }}
        >
          {preview.map((item) => (
            <SortableItem key={item.id} id={item.id} isPotentialGroup={false} item={item} />
          ))}
          {Boolean(other.length) && <Text className={cn('OtherElementsCount')} fs="18">{`+ ${other.length}`}</Text>}
        </div>
      </SortableContext>
      <AlbumTitle title={title} items={albumItems} />
      <ModalAlbum isAlbumOpen={isAlbumOpen} onClose={onAlbumClose} items={albumItems} />
    </div>
  )
}
