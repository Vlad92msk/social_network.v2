// SortableItem.tsx
import { useSortable } from '@dnd-kit/sortable'
import { ItemElement } from './ItemElement'


interface SortableItemProps {
  id: string
  isPotentialGroup: boolean
  disabled?: boolean
  item?: any
}

export function SortableItem(props: SortableItemProps) {
  const { id, isPotentialGroup, item, disabled = false } = props
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <ItemElement
      ref={setNodeRef}
      isHighlighted={isPotentialGroup}
      isPlaceholder={isDragging}
      style={style}
      attributes={attributes}
      listeners={listeners}
      item={item}
    />
  )
}
