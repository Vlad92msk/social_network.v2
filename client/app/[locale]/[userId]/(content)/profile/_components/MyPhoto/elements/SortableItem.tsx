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
    items,
    data,
    active,
    isOver,
    isSorting,
  } = useSortable({ id: props.id })

// console.group()
//   console.log('items', items)
//   console.log('data', data)
//   console.log('active', active)
//   console.log('isOver', isOver)
//   console.log('isSorting', isSorting)
//   console.log('transform', transform)
//   console.groupEnd()

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
      <div className={cn('PhotoContainer')}>
        {props.children}
      </div>
    </div>
  )
}

