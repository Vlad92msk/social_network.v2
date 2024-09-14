import { MediaApi } from "../../swagger/media/api-client-media";

export const mediaApiInstance = new MediaApi({
  baseUrl: process.env.DB_URL
});

