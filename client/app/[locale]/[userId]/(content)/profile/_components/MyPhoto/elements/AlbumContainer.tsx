import { SortableContext } from '@dnd-kit/sortable'
import { useBooleanState } from '@hooks'
import { Text } from '@ui/common/Text'
import { cn } from '../cn'
import { ModalAlbum } from './ModalAlbum'
import { SortableItem } from './SortableItem'

interface AlbumContainerProps {
  title?: string
  albumItems: any[]
  overItemId: string | null
}

export function AlbumContainer(props: AlbumContainerProps) {
  const { title, albumItems, overItemId } = props
  const [isAlbumOpen, onAlbumOpen, onAlbumClose] = useBooleanState(false)
  const [preview, other] = albumItems.reduce((acc, el, indx) => {
    if (indx <= 3) {
      acc[0].push(el)
    } else {
      acc[1].push(el)
    }

    return acc
  }, [[], []])

  return (
    <div
      className={cn(
        'AlbumContainer',
        {
          active: albumItems.some((item) => item.id === overItemId),
        },
      )}
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
            <SortableItem
              key={item.id}
              id={item.id}
              isPotentialGroup={false}
              item={item}
            >
              {item.name}
            </SortableItem>
          ))}
          {Boolean(other.length) && (
            <Text className={cn('OtherElementsCount')} fs="18">{`+ ${other.length}`}</Text>
          )}
        </div>
      </SortableContext>
      <Text className={cn('AlbumTitle')} fs="12" weight="bold">{title}</Text>
      <ModalAlbum isAlbumOpen={isAlbumOpen} onClose={onAlbumClose} items={albumItems} />
    </div>
  )
}
