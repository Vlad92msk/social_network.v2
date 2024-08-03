// SortableItem.tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '../cn'

export function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id: props.id })


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isOver ? 'green' : 'transparent',
      }}
      {...attributes}
      {...listeners}
      className={cn('PhotoItem')}
    >
        {props.children}
    </div>
  )
}

