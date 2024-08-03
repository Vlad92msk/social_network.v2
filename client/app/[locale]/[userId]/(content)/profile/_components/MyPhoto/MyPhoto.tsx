'use client'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useCallback, useEffect, useState } from 'react'
import { cn } from './cn'
import { SortableItem } from './elements'

interface MediaItem {
  id: string
  name: string
  album?: string
}

function random(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomAlbum() {
  return `Album_${Math.random().toString(36).substring(7)}`;
}

const albums = ['story', 'work', 'business']
const createArr = (count: number, name = ''): MediaItem[] => Array.from({ length: count }, (_, index) => ({
  id: String(index + 1),
  name: `${name} ${index + 1}`,
  album: index % 2 ? albums[random(0, albums.length - 1)] : undefined,
}))

export function MyPhoto() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setItems(createArr(30, 'photo'))
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = useCallback((event) => {
    const { active } = event
    setActiveId(active.id)
  }, [])

  const handleDragOver = useCallback((event) => {
    const { active, over } = event
    if (!over) return

    console.log('Active Item:', active.id)
    console.log('Over Item:', over.id)
  }, [])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over) return

    setItems((prevItems) => {
      const activeItem = prevItems.find(item => item.id === active.id)
      const overItem = prevItems.find(item => item.id === over.id)

      if (!activeItem || !overItem) return prevItems

      let newAlbum: string | undefined

      if (overItem.album) {
        newAlbum = overItem.album
      } else if (!activeItem.album && !overItem.album) {
        newAlbum = generateRandomAlbum()
      }

      return prevItems.map(item => {
        if (item.id === active.id) {
          return { ...item, album: newAlbum }
        }
        if (item.id === over.id && !overItem.album && !activeItem.album) {
          return { ...item, album: newAlbum }
        }
        return item
      })
    })

    setActiveId(null)
  }, [])

  return (
    <div className={cn()}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className={cn('PhotosContainer')}>
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id}>
                {item.name} - {item.album || 'No Album'}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div className={cn('PhotoItem')}>
              {items.find((item) => item.id === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
