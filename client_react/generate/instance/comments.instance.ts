import { CommentsApi } from '../../../swagger/comments/api-client-comments.ts'

export const commentsApiInstance = new CommentsApi({
  baseUrl: import.meta.env.VITE_API_URL,
})
