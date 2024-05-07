import { UserInfo } from '@api/users/types/user.type'

export interface ProfileType {
  id: string
  token: string
  dialogsIds: string[]
  userInfo: UserInfo
}
