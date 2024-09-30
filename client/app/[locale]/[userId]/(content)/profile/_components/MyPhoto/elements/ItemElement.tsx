import { DraggableAttributes } from '@dnd-kit/core'
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { CSSProperties } from 'react'
import { Image } from '@ui/common/Image'
import { ItemWithComments } from '@ui/components/item-with-comments'
import { MediaEntity } from '../../../../../../../../../swagger/media/interfaces-media'
import { cn } from '../cn'

interface ElementProps {
  isHighlighted?: boolean
  isPlaceholder?: boolean
  isDraging?: boolean
  style?: CSSProperties
  attributes?: DraggableAttributes
  listeners?: SyntheticListenerMap
  ref?: any
  item?: MediaEntity
}

export function ItemElement(props: ElementProps) {
  const {
    isDraging, isPlaceholder, isHighlighted, listeners, attributes, item, ...rest
  } = props

  return (
    <ItemWithComments item={item} target="media">
      <div
        className={
          cn('PhotoItem', {
            highlighted: isHighlighted,
            placeholder: isPlaceholder,
            dragging: isDraging,
          })
        }
        {...listeners}
        {...attributes}
        {...rest}
      >
        {item && (
          <Image
            src={item?.meta.src}
            alt={item?.meta.name}
            width={400}
            height={400}
          />
        )}
      </div>
    </ItemWithComments>
  )
}
