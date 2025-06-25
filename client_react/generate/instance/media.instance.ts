import { MediaApi } from '../../../swagger/media/api-client-media.ts'

export const mediaApiInstance = new MediaApi({
  baseUrl: import.meta.env.VITE_API_URL,
})
