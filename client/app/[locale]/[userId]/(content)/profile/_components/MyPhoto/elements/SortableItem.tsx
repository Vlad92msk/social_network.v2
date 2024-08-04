// SortableItem.tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '../cn'

export function SortableItem({ id, children, isHighlighted, isPotentialGroup }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (

      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={
        cn('PhotoItem', {
          highlighted: isPotentialGroup,
          placeholder: isDragging,
        })
      }
      >
        {children}
      </div>
  )
}