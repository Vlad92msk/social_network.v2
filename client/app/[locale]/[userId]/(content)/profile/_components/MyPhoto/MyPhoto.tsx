'use client'

import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { groupBy, omit } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from './cn'
import { AlbumContainer, SortableItem } from './elements'

interface MediaItem {
  id: string
  name: string
  album?: string
}

function random(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRandomAlbum() {
  return `Album_${Math.random().toString(36).substring(7)}`
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
  const [overItemId, setOverItemId] = useState<string | null>(null)
  const [potentialNewAlbum, setPotentialNewAlbum] = useState<string | null>(null)

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
    const grouped = groupBy(items, (item) => item.album || 'single')
    return {
      groupedItems: omit(grouped, 'single'),
      singleItems: grouped.single || [],
    }
  }, [items])

  const handleDragStart = useCallback((event) => {
    const { active } = event
    setActiveId(active.id)
  }, [])

  const handleDragOver = useCallback((event) => {
    const { active, over } = event
    if (!over) return

    const activeItem = items.find((item) => item.id === active.id)
    const overItem = items.find((item) => item.id === over.id)

    setOverItemId(over.id)

    if (!activeItem?.album && !overItem?.album && active.id !== over.id) {
      setPotentialNewAlbum(generateRandomAlbum())
    } else {
      setPotentialNewAlbum(null)
    }
  }, [items])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over) return

    setItems((prevItems) => {
      const activeItem = prevItems.find((item) => item.id === active.id)
      const overItem = prevItems.find((item) => item.id === over.id)

      if (!activeItem || !overItem) return prevItems

      let newAlbum: string | undefined

      if (overItem.album) {
        newAlbum = overItem.album
      } else if (!activeItem.album && !overItem.album && active.id !== over.id) {
        newAlbum = potentialNewAlbum || generateRandomAlbum()
      }

      return prevItems.map((item) => {
        if (item.id === active.id || (item.id === over.id && !overItem.album && !activeItem.album && active.id !== over.id)) {
          return { ...item, album: newAlbum }
        }
        return item
      })
    })

    setActiveId(null)
    setOverItemId(null)
    setPotentialNewAlbum(null)
  }, [potentialNewAlbum])

  return (
    <div className={cn()}>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
          {Object.entries(groupedItems)
            .map(([albumName, albumItems]) => (
              <AlbumContainer
                key={albumName}
                title={albumName}
                albumItems={albumItems}
                overItemId={overItemId}
              />
            ))}

          <SortableContext items={singleItems} strategy={horizontalListSortingStrategy}>
              {singleItems.map((item: MediaItem) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  isHighlighted={potentialNewAlbum !== null && (item.id === activeId || item.id === overItemId)}
                  isPotentialGroup={potentialNewAlbum !== null && (item.id === activeId || item.id === overItemId)}
                >
                  {item.name}
                </SortableItem>
              ))}
          </SortableContext>

        <DragOverlay >
          {activeId ? (
            <div className={cn('PhotoItem', { dragging: true })}>
              {items.find((item) => item.id === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
