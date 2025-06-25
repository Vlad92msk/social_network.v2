import { ProfileApi } from '../../../swagger/profile/api-client-profile'

export const profileApiInstance = new ProfileApi({
  baseUrl: import.meta.env.VITE_API_URL,
})
