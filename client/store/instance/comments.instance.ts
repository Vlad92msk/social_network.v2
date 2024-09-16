import { CommentsApi } from '../../../swagger/comments/api-client-comments'

export const commentsApiInstance = new CommentsApi({
  baseUrl: process.env.DB_URL
})
