import { DraggableAttributes } from '@dnd-kit/core'
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { CSSProperties } from 'react'
import { ItemWithComments } from '@ui/components/item-with-comments'
import { cn } from '../cn'

interface ElementProps {
  isHighlighted?: boolean
  isPlaceholder?: boolean
  isDraging?: boolean
  style?: CSSProperties
  attributes?: DraggableAttributes
  listeners?: SyntheticListenerMap
  ref?: any
  item?: any
}

export function ItemElement(props: ElementProps) {
  const {
    isDraging, isPlaceholder, isHighlighted, listeners, attributes, item, ...rest
  } = props

  return (
    <ItemWithComments item={item} module="photo">
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
        {item?.name}
      </div>
    </ItemWithComments>
  )
}
