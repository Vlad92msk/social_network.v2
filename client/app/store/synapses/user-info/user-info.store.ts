import { broadcastMiddleware, MemoryStorage } from 'synapse-storage/core'
import { AddedFile } from '@hooks'
import { UserInfo } from '../../../../../swagger/userInfo/interfaces-userInfo'
import { ApiStatusState, initialApiState } from '../../../types/apiStatus'

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

export interface AboutUserUserInfo {
  api: {
    updateUserInfo: ApiStatusState<UserInfo, FormData>
  }
  userInfoInit: UserInfo
  isChangeActive: boolean
  fieldsInit: AboutUserUserInfoFields
  fields: AboutUserUserInfoFields
}

export async function createUserInfoStorage() {
  const storageName = 'user-about'

  return new MemoryStorage<AboutUserUserInfo>({
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

export type UserPageStorage = Awaited<ReturnType<typeof createUserInfoStorage>>
