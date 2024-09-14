import { TagsApi } from "../../swagger/tags/api-client-tags";

export const tagsApiInstance = new TagsApi({
  baseUrl: process.env.DB_URL
});
