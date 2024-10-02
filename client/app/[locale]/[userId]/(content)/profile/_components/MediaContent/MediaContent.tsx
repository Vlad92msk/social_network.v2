'use client'

import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { groupBy, omit, uniqBy } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MaterialAttachProps } from '@hooks'
import { FileUpLoad } from '@ui/common/FileUpLoad'
import { Text } from '@ui/common/Text'
import { cn } from './cn'
import { AlbumContainer, ItemElement, SortableItem } from './elements'
import { MediaMetadata, MediaResponseDto } from '../../../../../../../../swagger/media/interfaces-media'
import { mediaApi } from '../../../../../../../store/api'
import { FILE_FORMAT_AUDIO, FILE_FORMAT_IMAGE, FILE_FORMAT_VIDEO } from '../../../../../../types/fileFormats'

function generateRandomAlbum() {
  return `Album_${Math.random().toString(36).substring(7)}`
}

const availableTypes = {
  audio: Object.values(FILE_FORMAT_AUDIO),
  video: Object.values(FILE_FORMAT_VIDEO),
  image: Object.values(FILE_FORMAT_IMAGE),
}

const maxFileSize: Record<'audio' | 'video' | 'image', MaterialAttachProps['maxFileSize']> = {
  audio: '10mb',
  video: '20mb',
  image: '5mb',
}

interface MyPhotoProps {
  type: MediaMetadata['type']
}

export function MediaContent(props: MyPhotoProps) {
  const { type } = props
  const [items, setItems] = useState<MediaResponseDto[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overItemId, setOverItemId] = useState<string | null>(null)
  const [potentialNewAlbum, setPotentialNewAlbum] = useState<string | null>(null)

  const media = mediaApi.useGetFilesQuery({ type, source: 'user_uploaded_media' })

  const [onMediaUpdate] = mediaApi.useUpdateMediaMutation()
  const [onMediaUpload] = mediaApi.useUploadFilesMutation()

  useEffect(() => {
    // @ts-ignore
    setItems(media.data)
  }, [media])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Активирует перетаскивание только после перемещения на 8 пикселей
      },
    }),
  )

  const { groupedItems, singleItems } = useMemo(() => {
    const grouped = groupBy(items, (item) => item.album_name || 'single')
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

    if (!activeItem?.album_name && !overItem?.album_name && active.id !== over.id) {
      setPotentialNewAlbum(generateRandomAlbum())
    } else {
      setPotentialNewAlbum(null)
    }
  }, [items])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over) return

    const updatedItems: MediaResponseDto[] = []

    setItems((prevItems) => {
      const activeItem = prevItems.find((item) => item.id === active.id)
      const overItem = prevItems.find((item) => item.id === over.id)

      if (!activeItem || !overItem) return prevItems

      let newAlbum: string | undefined

      if (overItem.album_name) {
        newAlbum = overItem.album_name
      } else if (!activeItem.album_name && !overItem.album_name && active.id !== over.id) {
        newAlbum = potentialNewAlbum || generateRandomAlbum()
      }

      return prevItems.map((item) => {
        if (item.id === active.id || (item.id === over.id && !overItem.album_name && !activeItem.album_name && active.id !== over.id)) {
          const result = { ...item, album_name: newAlbum }
          updatedItems.push(result)
          return result
        }
        return item
      })
    })
    const uniqItems = uniqBy(updatedItems, 'id')
    onMediaUpdate({ body: {
      target_ids: uniqItems.map(({ id }) => id),
      // @ts-ignore
      album_name: uniqItems[0]?.album_name || null,
    } })
    setActiveId(null)
    setOverItemId(null)
    setPotentialNewAlbum(null)
  }, [onMediaUpdate, potentialNewAlbum])

  return (
    <div className={cn()}>
      <DndContext
        sensors={sensors}
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

        <SortableContext items={singleItems}>
          {singleItems.map((item: MediaResponseDto) => (
            <SortableItem
              key={item.id}
              id={item.id}
              item={item}
              isPotentialGroup={potentialNewAlbum !== null && (item.id === activeId || item.id === overItemId)}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeId ? <ItemElement isDraging /> : null}
        </DragOverlay>
      </DndContext>
      <FileUpLoad
        className={cn('PhotoItem')}
        buttonElement={<Text fs="12" className={cn('ButtonUpload')}>Загрузить файлы</Text>}
        isConfirm
        availableTypes={{
          maxFileSize: maxFileSize[type],
          availableTypes: availableTypes[type],
        }}
        onApplyWithGroup={(files) => {
          const formData = new FormData()

          if (files.image) {
            files.image.forEach((file) => {
              if (file.blob) {
                formData.append('files', file.blob, file.name)
              }
            })
          }

          // @ts-ignore
          onMediaUpload({ body: formData })
        }}
      />
    </div>
  )
}
