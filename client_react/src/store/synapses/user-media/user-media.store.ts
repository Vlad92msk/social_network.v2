import { DeleteFilePayload, GetFilesPayload, UpdateMediaPayload, UploadFilesPayload } from '@store/api/media.api.ts'
import { broadcastMiddleware, MemoryStorage } from 'synapse-storage/core'

import { MediaEntity } from '../../../../../swagger/media/interfaces-media.ts'
import { ApiStatusState, initialApiState } from '../../../models/apiStatus'

export type AvailableMediaTypes = Extract<GetFilesPayload['type'], 'audio' | 'video' | 'image'>

export interface UserMediaStorage {
  api: {
    // Техническое поле чтобы вызывать получение медиал любого типа
    getMediaRequest: ApiStatusState<GetFilesPayload, MediaEntity[]>
    uploadMediaRequest: ApiStatusState<UploadFilesPayload, MediaEntity[]>
    updateMediaRequest: ApiStatusState<UpdateMediaPayload, any>
    deleteMediaRequest: ApiStatusState<DeleteFilePayload, any>
  }
  selectedType: AvailableMediaTypes
  media: Record<AvailableMediaTypes, MediaEntity[]>
}

export async function createUserMediaStorage() {
  const storageName = 'user-media'

  return new MemoryStorage<UserMediaStorage>({
    name: storageName,
    initialState: {
      api: {
        getMediaRequest: initialApiState,
        updateMediaRequest: initialApiState,
        uploadMediaRequest: initialApiState,
        deleteMediaRequest: initialApiState,
      },
      selectedType: 'image',
      media: {
        audio: [],
        video: [],
        image: [],
      } as Record<AvailableMediaTypes, MediaEntity[]>,
    },
    middlewares: () => {
      const broadcast = broadcastMiddleware({
        storageName,
        storageType: 'memory',
      })
      return [broadcast]
    },
  }).initialize()
}
