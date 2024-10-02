import { DraggableAttributes } from '@dnd-kit/core'
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { Image } from '@ui/common/Image'
import { ItemWithComments } from '@ui/components/item-with-comments'
import { MediaItemElement } from '@ui/components/media-item-element'
import { CSSProperties } from 'react'
import { MediaResponseDto } from '../../../../../../../../../swagger/media/interfaces-media'
import { cn } from '../cn'

interface ElementProps {
  isHighlighted?: boolean
  isPlaceholder?: boolean
  isDraging?: boolean
  style?: CSSProperties
  attributes?: DraggableAttributes
  listeners?: SyntheticListenerMap
  ref?: any
  item?: MediaResponseDto
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
        <MediaItemElement mediaInfoId={item?.id} type={item?.meta.type} metadata={item?.meta} />
      </div>
    </ItemWithComments>
  )
}
