import { USER_INFO } from '@api/users/data/userInfo.data'
import { ProfileType } from '../types/profile.type'

export const PROFILE: ProfileType[] = [
  {
    id: 'fvsasus@gmail.com',
    dialogs: ['1', '2'],
    token: 'fake-token',
    userInfo: USER_INFO[0],
  },
]
