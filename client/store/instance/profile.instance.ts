import { ProfileApi } from '../../../swagger/profile/api-client-profile'

export const profileApiInstance = new ProfileApi({
  baseUrl: process.env.DB_URL
});
