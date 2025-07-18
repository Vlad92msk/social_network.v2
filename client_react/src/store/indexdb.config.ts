import { IndexedDBStorage } from 'synapse-storage/core'

import { initialApiState } from '../models/apiStatus.ts'
import { IDBApi, IDBCore } from './types'

export const { CORE, API__USER_INFO, API__USER_PROFILE, API__USER_MEDIA } = await IndexedDBStorage.createStorages<{
  CORE: IDBCore
  API__USER_INFO: IDBApi
  API__USER_PROFILE: IDBApi
  API__USER_MEDIA: IDBApi
}>(
  'social-network', // Название базы данных в indexDB
  // Таблицы:
  {
    //---------------
    // Хранение запросов для кэширования
    API__USER_INFO: {
      name: 'api-user-about',
    },
    API__USER_PROFILE: {
      name: 'api-user-profile',
    },
    API__USER_MEDIA: {
      name: 'api-user-media',
    },

    //---------------
    // Основные данные проекта
    CORE: {
      name: 'core',
      initialState: {
        api: {
          profileInfo: initialApiState,
        },
      },
    },
  },
)
