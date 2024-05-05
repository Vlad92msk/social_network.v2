import { Dialog } from '@api/messenger/communicateList/types'
import { UserInfo } from '@api/users/types/user.type'

export interface ProfileType {
  id: string
  token: string
  dialogs: Dialog[]
  userInfo: UserInfo
}
