import { ProfileInfoType, ProfileType } from '../_interfaces'
import { USER } from '@src/services/users/_data/users.data'


export const PROFILE_INFO: ProfileInfoType = {
    id: 1,
    email: 'dwed@mail.ru',
    type: ProfileType.USER,
    user_info: USER,
    settings: null
}
