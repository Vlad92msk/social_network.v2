import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileUpLoad, Spinner, Text } from '@components/ui'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { MaterialAttachProps } from '@hooks'
import { AvailableMediaTypes, userMediaReady, UserMediaStorage, userMediaSynapse } from '@store/synapses/user-media'
import { groupBy, omit } from 'lodash'
import { useSelector } from 'synapse-storage'

import { FILE_FORMAT_AUDIO, FILE_FORMAT_IMAGE, FILE_FORMAT_VIDEO } from '../../../../../../models/fileFormats'
import { cn } from './cn'
import { AlbumContainer, ItemElement, SortableItem } from './elements'

const { actions, selectors } = userMediaSynapse

function generateRandomAlbum() {
  return `Album_${Math.random().toString(36).substring(7)}`
}

const availableTypes = {
  audio: Object.values(FILE_FORMAT_AUDIO),
  video: Object.values(FILE_FORMAT_VIDEO),
  image: Object.values(FILE_FORMAT_IMAGE),
}

interface MyPhotoProps {
  type: UserMediaStorage['selectedType']
}

const maxFileSize: Record<AvailableMediaTypes, MaterialAttachProps['maxFileSize']> = {
  audio: '10mb',
  video: '20mb',
  image: '5mb',
}

export const MediaContent = userMediaReady.withSynapseReady<MyPhotoProps>((props) => {
  const { type } = props
  // Инициализация модуля при монтировании
  useEffect(() => {
    actions.moduleEnter({ mediaType: type })
  }, [type])

  const selectedType = useSelector(selectors.selectedType)
  const selectedMedia = useSelector(selectors.selectedMedia)
  const hasError = useSelector(selectors.hasError)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overItemId, setOverItemId] = useState<string | null>(null)
  const [potentialNewAlbum, setPotentialNewAlbum] = useState<string | null>(null)

  // Группировка медиа
  const { groupedItems, singleItems } = useMemo(() => {
    if (!selectedMedia?.length) return { groupedItems: {}, singleItems: [] }

    const grouped = groupBy(selectedMedia, (item) => item.album_name || 'single')
    return {
      groupedItems: omit(grouped, 'single'),
      singleItems: grouped.single || [],
    }
  }, [selectedMedia])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Активирует перетаскивание только после перемещения на 8 пикселей
      },
    }),
  )

  // Обработчик начала перетаскивания
  const handleDragStart = useCallback((event: any) => {
    const { active } = event
    setActiveId(active.id)
  }, [])

  // Обработчик перетаскивания
  const handleDragOver = useCallback(
    (event: any) => {
      const { active, over } = event
      setOverItemId(over?.id || null)

      if (!over || !selectedMedia) {
        setPotentialNewAlbum(null)
        return
      }

      const activeItem = selectedMedia.find((item) => item.id === active.id)
      const overItem = selectedMedia.find((item) => item.id === over.id)

      if (!activeItem) return

      if (overItem?.album_name && overItem.album_name !== activeItem.album_name) {
        setPotentialNewAlbum(overItem.album_name)
      } else if (!overItem?.album_name && !activeItem.album_name && active.id !== over.id) {
        setPotentialNewAlbum(generateRandomAlbum())
      } else {
        setPotentialNewAlbum(null)
      }
    },
    [selectedMedia, generateRandomAlbum],
  )

  // Обработчик завершения перетаскивания
  const handleDragEnd = useCallback(
    async (event: any) => {
      const { active, over } = event

      // Сохраняем состояние для отката
      const previousMedia = selectedMedia ? [...selectedMedia] : []

      try {
        const result = await actions.processDragEnd({
          activeId: active.id,
          overId: over?.id,
          //@ts-ignore
          potentialNewAlbum,
        })

        if (result.itemsToUpdate?.length > 0) {
          const targetIds = result.itemsToUpdate.map(({ id }) => id).filter(Boolean)

          if (targetIds.length > 0) {
            await actions.updateMediaInit({
              body: {
                target_ids: targetIds,
                //@ts-ignore
                album_name: result.itemsToUpdate[0]?.album_name || null,
              },
            })
          }
        }
      } catch (error) {
        // Откат изменений при ошибке
        if (previousMedia.length > 0) {
          await actions.rollbackDragChanges({ previousMedia })
        }
      } finally {
        // Всегда сбрасываем состояние
        setActiveId(null)
        setOverItemId(null)
        setPotentialNewAlbum(null)
      }
    },
    [potentialNewAlbum, selectedMedia],
  )

  // Обработчик загрузки файлов
  const handleFileUpload = useCallback(
    async (files: any) => {
      if (!selectedType) return

      const formData = new FormData()

      files[selectedType]?.forEach((file: any) => {
        if (file.blob) {
          formData.append('files', file.blob, file.name)
        }
      })

      if (formData.has('files')) {
        // @ts-ignore
        await actions.uploadMediaInit({ body: formData })
      }
    },
    [selectedType],
  )

  return (
    <div className={cn()} data-dnd-id="ungroup-area">
      {hasError && (
        <div className="error-state">
          <p>Произошла ошибка при загрузке медиа</p>
          <button onClick={() => actions.moduleEnter({ mediaType: type })}>Попробовать снова</button>
        </div>
      )}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {Object.entries(groupedItems).map(([albumName, albumItems]) => (
          <AlbumContainer
            key={albumName}
            title={albumName}
            //@ts-ignore
            albumItems={albumItems}
            overItemId={overItemId}
          />
        ))}

        <SortableContext items={singleItems}>
          {singleItems.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              //@ts-ignore
              item={item}
              isPotentialGroup={potentialNewAlbum !== null && (item.id === activeId || item.id === overItemId)}
            />
          ))}
        </SortableContext>

        <DragOverlay>{activeId ? <ItemElement isDraging /> : null}</DragOverlay>
      </DndContext>
      {selectedType && (
        <FileUpLoad
          className={cn('PhotoItem')}
          buttonElement={
            <Text fs="12" className={cn('ButtonUpload')}>
              Загрузить файлы
            </Text>
          }
          isConfirm
          availableTypes={{
            maxFileSize: maxFileSize[selectedType],
            availableTypes: availableTypes[selectedType],
          }}
          onApplyWithGroup={handleFileUpload}
        />
      )}
    </div>
  )
})
