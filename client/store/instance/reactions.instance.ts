import { ReactionsApi } from '../../../swagger/reactions/api-client-reactions'

export const reactionsApiInstance = new ReactionsApi({
  baseUrl: process.env.DB_URL,
})
