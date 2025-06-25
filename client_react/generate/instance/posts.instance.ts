import { PostsApi } from "../../../swagger/posts/api-client-posts.ts";


export const postsApiInstance = new PostsApi({
  baseUrl: import.meta.env.VITE_API_URL,
});
