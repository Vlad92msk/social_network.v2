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
import { useCallback, useEffect, useState, useMemo } from 'react'
import { cn } from './cn'
import { SortableItem } from './elements'
import { groupBy, omit } from 'lodash'

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
  const [overContainer, setOverContainer] = useState<string | null>(null)
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

  const { groupedItems, singleItems } = useMemo(() => {
    const grouped = groupBy(items, item => item.album || 'single')
    return {
      groupedItems: omit(grouped, 'single'),
      singleItems: grouped['single'] || []
    }
  }, [items])

  const handleDragStart = useCallback((event) => {
    const { active } = event
    setActiveId(active.id)
  }, [])

  const handleDragOver = useCallback((event) => {
    const { active, over } = event
    if (!over) return

    const activeItem = items.find(item => item.id === active.id)
    const overItem = items.find(item => item.id === over.id)

    if (overItem && overItem.album !== activeItem?.album) {
      setOverContainer(overItem.album || 'single')
    } else {
      setOverContainer(null)
    }
  }, [items])

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
    setOverContainer(null)
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
        <div className={cn('AlbumsContainer')}>
          {Object.entries(groupedItems).map(([albumName, albumItems]) => (
            <div key={albumName} className={cn('AlbumContainer', {active: overContainer === albumName})}>
              <h3>{albumName}</h3>
              <SortableContext items={albumItems} strategy={verticalListSortingStrategy}>
                <div className={cn('PhotosContainer')}>
                  {albumItems.map((item: MediaItem) => (
                    <SortableItem key={item.id} id={item.id}>
                      {item.name}
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}

          {singleItems.length > 0 && (
            <div className={cn('AlbumContainer')}>
              <SortableContext items={singleItems} strategy={verticalListSortingStrategy}>
                <div className={cn('PhotosContainer')}>
                  {singleItems.map((item: MediaItem) => (
                    <SortableItem key={item.id} id={item.id}>
                      {item.name}
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </div>
          )}
        </div>

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
