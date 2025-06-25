import { ReactionsApi } from '../../../swagger/reactions/api-client-reactions.ts'

export const reactionsApiInstance = new ReactionsApi({
  baseUrl: import.meta.env.VITE_API_URL,
})
