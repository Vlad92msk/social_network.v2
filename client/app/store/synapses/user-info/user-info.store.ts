import { AddedFile } from '@hooks'
import { ApiStatusState, initialApiState } from '../../../types/apiStatus'
import { MemoryStorage } from 'synapse-storage/core'
import { UserInfo } from '../../../../../swagger/userInfo/interfaces-userInfo'


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
  return new MemoryStorage<AboutUserUserInfo>({
    name: 'user-info',
    initialState: {
      api: {
        updateUserInfo: initialApiState,
      },
      userInfoInit: undefined,
      isChangeActive: false,
      fieldsInit: {},
      fields: {},
    },
  }).initialize()
}

export type UserPageStorage = Awaited<ReturnType<typeof createUserInfoStorage>>
