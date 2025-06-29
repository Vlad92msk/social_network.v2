import { MaterialAttachProps } from '@hooks'

import { MediaMetadata } from '../../../../../../../../swagger/media/interfaces-media'
import { FILE_FORMAT_AUDIO, FILE_FORMAT_IMAGE, FILE_FORMAT_VIDEO } from '../../../../../../models/fileFormats.ts'
import { cn } from './cn'

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
  // const params = useParams<UserPageProps['params']>()
  //
  // const [items, setItems] = useState<MediaResponseDto[]>([])
  // const [activeId, setActiveId] = useState<string | null>(null)
  // const [overItemId, setOverItemId] = useState<string | null>(null)
  // const [potentialNewAlbum, setPotentialNewAlbum] = useState<string | null>(null)
  //
  // const { data, isLoading } = mediaApi.useGetFilesQuery({
  //   type,
  //   source: 'user_uploaded_media',
  //   owner_public_id: params.userId,
  // })
  //
  // const [onMediaUpdate] = mediaApi.useUpdateMediaMutation()
  // const [onMediaUpload] = mediaApi.useUploadFilesMutation()
  //
  // /**
  //  * TODO: возможно это не нужно, а можно работать с данными из кэша
  //  * пока делаю лиж бы работало
  //  */
  // useEffect(() => {
  //   // @ts-ignore
  //   setItems(data)
  // }, [data])
  //
  // const sensors = useSensors(
  //   useSensor(PointerSensor, {
  //     activationConstraint: {
  //       distance: 8, // Активирует перетаскивание только после перемещения на 8 пикселей
  //     },
  //   }),
  // )
  //
  // const { groupedItems, singleItems } = useMemo(() => {
  //   const grouped = groupBy(items, (item) => item.album_name || 'single')
  //   return {
  //     groupedItems: omit(grouped, 'single'),
  //     singleItems: grouped.single || [],
  //   }
  // }, [items])
  //
  // const handleDragStart = useCallback((event) => {
  //   const { active } = event
  //   setActiveId(active.id)
  // }, [])
  //
  // const handleDragOver = useCallback(
  //   (event) => {
  //     const { active, over } = event
  //
  //     setOverItemId(over ? over.id : null)
  //
  //     if (!over) {
  //       // Если перетаскиваем "в никуда", готовимся к разгруппировке
  //       setPotentialNewAlbum(null)
  //       return
  //     }
  //
  //     const activeItem = items.find((item) => item.id === active.id)
  //     if (!activeItem) return
  //
  //     const overItem = items.find((item) => item.id === over.id)
  //
  //     if (overItem?.album_name && overItem.album_name !== activeItem.album_name) {
  //       // Если перетаскиваем над другим альбомом
  //       setPotentialNewAlbum(overItem.album_name)
  //     } else if (!overItem?.album_name && !activeItem.album_name && active.id !== over.id) {
  //       // Если перетаскиваем над одиночным элементом для создания нового альбома
  //       setPotentialNewAlbum(generateRandomAlbum())
  //     } else {
  //       setPotentialNewAlbum(null)
  //     }
  //   },
  //   [items],
  // )
  //
  // const handleDragEnd = useCallback(
  //   (event) => {
  //     const { active, over } = event
  //
  //     const updatedItems: MediaResponseDto[] = []
  //
  //     setItems((prevItems) => {
  //       const activeItem = prevItems.find((item) => item.id === active.id)
  //       if (!activeItem) return prevItems
  //
  //       let newAlbum: string | undefined
  //
  //       if (!over) {
  //         // Если перетащили "в никуда", разгруппируем элемент
  //         newAlbum = undefined
  //       } else {
  //         const overItem = prevItems.find((item) => item.id === over.id)
  //         if (overItem?.album_name) {
  //           // Если перетаскиваем в существующий альбом
  //           newAlbum = overItem.album_name
  //         } else if (!overItem?.album_name && !activeItem.album_name && active.id !== over.id) {
  //           // Если создаем новый альбом из двух одиночных элементов
  //           newAlbum = potentialNewAlbum || generateRandomAlbum()
  //         } else {
  //           // Если перетаскиваем в ту же область, оставляем как есть
  //           newAlbum = activeItem.album_name
  //         }
  //       }
  //
  //       return prevItems.map((item) => {
  //         if (item.id === active.id) {
  //           const result = { ...item, album_name: newAlbum }
  //           updatedItems.push(result)
  //           return result
  //         }
  //         if (over && newAlbum && item.id === over.id && !item.album_name) {
  //           // Если создаем новый альбом, добавляем и перетаскиваемый элемент, и элемент, над которым он находится
  //           const result = { ...item, album_name: newAlbum }
  //           updatedItems.push(result)
  //           return result
  //         }
  //         return item
  //       })
  //     })
  //
  //     const uniqItems = uniqBy(updatedItems, 'id')
  //     onMediaUpdate({
  //       body: {
  //         target_ids: uniqItems.map(({ id }) => id),
  //         // @ts-ignore
  //         album_name: uniqItems[0]?.album_name || null,
  //       },
  //     })
  //
  //     setActiveId(null)
  //     setOverItemId(null)
  //     setPotentialNewAlbum(null)
  //   },
  //   [onMediaUpdate, potentialNewAlbum],
  // )

  return (
    <div className={cn()} data-dnd-id="ungroup-area">
      {/* {isLoading ? ( */}
      {/*   <Spinner /> */}
      {/* ) : ( */}
      {/*   <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}> */}
      {/*     {Object.entries(groupedItems).map(([albumName, albumItems]) => ( */}
      {/*       <AlbumContainer key={albumName} title={albumName} albumItems={albumItems} overItemId={overItemId} /> */}
      {/*     ))} */}

      {/*     <SortableContext items={singleItems}> */}
      {/*       {singleItems.map((item: MediaResponseDto) => ( */}
      {/*         <SortableItem key={item.id} id={item.id} item={item} isPotentialGroup={potentialNewAlbum !== null && (item.id === activeId || item.id === overItemId)} /> */}
      {/*       ))} */}
      {/*     </SortableContext> */}

      {/*     <DragOverlay>{activeId ? <ItemElement isDraging /> : null}</DragOverlay> */}
      {/*   </DndContext> */}
      {/* )} */}
      {/* <FileUpLoad */}
      {/*   className={cn('PhotoItem')} */}
      {/*   buttonElement={ */}
      {/*     <Text fs="12" className={cn('ButtonUpload')}> */}
      {/*       Загрузить файлы */}
      {/*     </Text> */}
      {/*   } */}
      {/*   isConfirm */}
      {/*   availableTypes={{ */}
      {/*     maxFileSize: maxFileSize[type], */}
      {/*     availableTypes: availableTypes[type], */}
      {/*   }} */}
      {/*   onApplyWithGroup={(files) => { */}
      {/*     const formData = new FormData() */}

      {/*     if (files.image) { */}
      {/*       files.image.forEach((file) => { */}
      {/*         if (file.blob) { */}
      {/*           formData.append('files', file.blob, file.name) */}
      {/*         } */}
      {/*       }) */}
      {/*     } */}

      {/*     // @ts-ignore */}
      {/*     onMediaUpload({ body: formData }) */}
      {/*   }} */}
      {/* /> */}
    </div>
  )
}
