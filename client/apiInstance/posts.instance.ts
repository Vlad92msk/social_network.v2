import { PostsApi } from "../../swagger/posts/api-client-posts";


export const postsApiInstance = new PostsApi({
  baseUrl: process.env.DB_URL
});
