import { UserInfoApi } from '../../../swagger/userInfo/api-client-userInfo.ts'

export const userInfoApiInstance = new UserInfoApi({
  baseUrl: import.meta.env.VITE_API_URL,
})
