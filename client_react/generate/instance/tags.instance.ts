import { TagsApi } from '../../../swagger/tags/api-client-tags.ts'

export const tagsApiInstance = new TagsApi({
  baseUrl: import.meta.env.VITE_API_URL,
})
