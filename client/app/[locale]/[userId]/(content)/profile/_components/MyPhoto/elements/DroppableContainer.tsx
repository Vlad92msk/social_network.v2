// DroppableContainer.tsx
import { useDroppable } from '@dnd-kit/core'
import { cn } from '../cn'

export function DroppableContainer(props) {
  const { setNodeRef } = useDroppable({
    id: props.id,
  })

  return (
    <div ref={setNodeRef} className={cn('AlbumContainer')}>
      {props.children}
    </div>
  )
}
