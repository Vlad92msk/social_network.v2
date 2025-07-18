import { AddedFile } from '@hooks'
import { broadcastMiddleware, MemoryStorage } from 'synapse-storage/core'

import { UserInfo } from '../../../../../swagger/userInfo/interfaces-userInfo'
import { ApiStatusState, initialApiState } from '../../../models/apiStatus'

export interface AboutUserUserInfoFields {
  information?: string
  position?: string
  university?: string
  company?: string
  banner?: string
  name?: string
  image?: string
  bannerUploadFile?: AddedFile
  imageUploadFile?: AddedFile
}

export interface AboutUserStorage {
  api: {
    updateUserInfo: ApiStatusState<FormData, UserInfo>
  }
  userInfoInit: UserInfo
  isChangeActive: boolean
  fieldsInit: AboutUserUserInfoFields
  fields: AboutUserUserInfoFields
}

export async function createUserAboutStorage() {
  const storageName = 'user-about'

  return new MemoryStorage<AboutUserStorage>({
    name: storageName,
    initialState: {
      api: {
        updateUserInfo: initialApiState,
      },
      userInfoInit: undefined,
      isChangeActive: false,
      fieldsInit: {},
      fields: {},
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
