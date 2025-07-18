import { DeleteFilePayload, GetFilesPayload, UpdateMediaPayload, UploadFilesPayload } from '@store/api/media.api'
import { loggerMiddleware } from '@store/synapses/settings'
import { createApiActions } from '@store/utils/createApiActions'
import { uniqBy } from 'lodash'
import { IStorage } from 'synapse-storage/core'
import { createDispatcher } from 'synapse-storage/reactive'

import { MediaEntity } from '../../../../../swagger/media/interfaces-media'
import { AvailableMediaTypes, UserMediaStorage } from './user-media.store.ts'

type UserMediaModuleEnter = {
  mediaType: UserMediaStorage['selectedType']
}

interface DragEndParams {
  activeId: string
  overId?: string
  potentialNewAlbum?: string
}

export function createUserMediaDispatcher(store: IStorage<UserMediaStorage>) {
  return createDispatcher({ storage: store, middlewares: [loggerMiddleware] }, (storage, { createAction }) => {
    const getUserMediaActions = createApiActions<UserMediaStorage, GetFilesPayload, MediaEntity[]>(storage, createAction, 'getMediaRequest')
    const uploadUserMediaActions = createApiActions<UserMediaStorage, UploadFilesPayload, MediaEntity[]>(storage, createAction, 'uploadMediaRequest')
    const updateUserMediaActions = createApiActions<UserMediaStorage, UpdateMediaPayload, any>(storage, createAction, 'updateMediaRequest')
    const deleteUserMediaActions = createApiActions<UserMediaStorage, DeleteFilePayload, any>(storage, createAction, 'deleteMediaRequest')

    return {
      moduleEnter: createAction<UserMediaModuleEnter, UserMediaModuleEnter>(
        {
          type: 'moduleEnter',
          action: (params) => {
            if (params?.mediaType) {
              storage.set('selectedType', params.mediaType)
            }
            return params
          },
          meta: { description: `Инициализация модуля ${storage.name}` },
        },
        {
          memoize: (a, b) => {
            return a[0].mediaType === b[0].mediaType
          },
        },
      ),

      // Получение медиа
      userMediaInit: getUserMediaActions.init,
      userMediaRequest: getUserMediaActions.request,
      userMediaSuccess: getUserMediaActions.success,
      userMediaError: getUserMediaActions.failure,

      // Загрузка на сервер медиа
      uploadMediaInit: uploadUserMediaActions.init,
      uploadMediaRequest: uploadUserMediaActions.request,
      uploadMediaSuccess: uploadUserMediaActions.success,
      uploadMediaError: uploadUserMediaActions.failure,

      // Обновление медиа
      updateMediaInit: updateUserMediaActions.init,
      updateMediaRequest: updateUserMediaActions.request,
      updateMediaSuccess: updateUserMediaActions.success,
      updateMediaError: updateUserMediaActions.failure,

      // Удаление медиа
      deleteMediaInit: deleteUserMediaActions.init,
      deleteMediaRequest: deleteUserMediaActions.request,
      deleteMediaSuccess: deleteUserMediaActions.success,
      deleteMediaError: deleteUserMediaActions.failure,

      applyMedia: createAction<MediaEntity[], UserMediaStorage['media']>({
        type: 'applyMedia',
        meta: { description: 'Сохраняем полученные медиа по их типу' },
        action: async (params) => {
          await storage.update((state) => {
            if (state.selectedType) {
              state.media[state.selectedType] = params
            }
          })
          return (await storage.get('media')) as UserMediaStorage['media']
        },
      }),

      updateCurrentMedia: createAction<MediaEntity[], UserMediaStorage['media']>({
        type: 'updateCurrentMedia',
        meta: { description: 'Обновляем медиа по их типу' },
        action: async (params) => {
          await storage.update((state) => {
            const type = state.selectedType
            if (type) {
              state.media[type] = params
            }
          })

          return (await storage.get('media')) as UserMediaStorage['media']
        },
      }),

      processDragEnd: createAction<DragEndParams, { updatedMedia: MediaEntity[]; itemsToUpdate: MediaEntity[] }>({
        type: 'processDragEnd',
        meta: { description: 'Обработка завершения перетаскивания - обновление локального состояния' },

        action: async (params) => {
          const currentState = (await storage.get('')) as UserMediaStorage
          const currentType = currentState.selectedType

          if (!currentType) {
            throw new Error('Не выбран тип медиа')
          }

          const items = currentState.media[currentType] || []
          const activeItem = items.find((item) => item.id === params.activeId)

          if (!activeItem) {
            throw new Error('Активный элемент не найден')
          }

          // Проверки на отсутствие изменений
          if (!params.overId && !activeItem.album_name) {
            return { updatedMedia: items, itemsToUpdate: [] }
          }

          if (params.activeId === params.overId) {
            return { updatedMedia: items, itemsToUpdate: [] }
          }

          // Определение нового альбома
          let newAlbum: string | undefined
          const overItem = items.find((item) => item.id === params.overId)

          if (!params.overId) {
            newAlbum = undefined
          } else if (overItem?.album_name) {
            newAlbum = overItem.album_name
            if (activeItem.album_name === newAlbum) {
              return { updatedMedia: items, itemsToUpdate: [] }
            }
          } else if (!overItem?.album_name && !activeItem?.album_name) {
            newAlbum = params.potentialNewAlbum || `Album_${Math.random().toString(36).substring(7)}`
          } else {
            newAlbum = activeItem?.album_name
            if (activeItem.album_name === newAlbum) {
              return { updatedMedia: items, itemsToUpdate: [] }
            }
          }

          // Обновление элементов
          const updatedItems: MediaEntity[] = []
          const updatedMedia = items.map((item) => {
            if (item.id === params.activeId) {
              const updatedItem = { ...item, album_name: newAlbum }
              updatedItems.push(updatedItem)
              return updatedItem
            }
            if (params.overId && newAlbum && item.id === params.overId && !item.album_name) {
              const updatedItem = { ...item, album_name: newAlbum }
              updatedItems.push(updatedItem)
              return updatedItem
            }
            return item
          })

          // Обновление состояния
          await storage.update((state) => {
            if (state.selectedType) {
              state.media[state.selectedType] = updatedMedia
            }
          })

          const uniqItems = uniqBy(updatedItems, 'id')
          return {
            updatedMedia,
            itemsToUpdate: uniqItems.length > 0 ? uniqItems : [],
          }
        },
      }),
      // Откат изменений в случае ошибки API
      rollbackDragChanges: createAction<{ previousMedia: MediaEntity[] }, void>({
        type: 'rollbackDragChanges',
        meta: { description: 'Откат изменений drag and drop в случае ошибки API' },
        action: async ({ previousMedia }) => {
          await storage.update((state) => {
            const type = state.selectedType
            if (type) {
              state.media[type] = previousMedia
            }
          })
        },
      }),
    }
  })
}

export type UserMediaDispatcher = ReturnType<typeof createUserMediaDispatcher>
