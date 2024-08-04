import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { Text } from '@ui/common/Text'
import { SortableItem } from './SortableItem'
import { cn } from '../cn'

interface AlbumContainerProps {
  title?: string
  albumItems: any[]
  overItemId: string | null
}

export function AlbumContainer(props: AlbumContainerProps) {
  const { title, albumItems, overItemId } = props

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
      key={title}
      className={cn('AlbumContainer', { active: albumItems.some((item) => item.id === overItemId) })}
    >
      <SortableContext items={albumItems} strategy={horizontalListSortingStrategy}>
        <div className={cn('PhotosContainer', { isAlbum: true })}>
          {preview.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              isHighlighted={false}
              isPotentialGroup={false}
            >
              {item.name}
            </SortableItem>
          ))}
        </div>
        {Boolean(other.length) && (
          <Text className={cn('OtherElementsCount')}>{other.length}</Text>
        )}
      </SortableContext>
      <Text className={cn('AlbumTitle')}>{title}</Text>
    </div>
  )
}
