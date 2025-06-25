import { DialogsApi } from "../../../swagger/dialogs/api-client-dialogs.ts";

export const dialogsApiInstance = new DialogsApi({
  baseUrl: import.meta.env.VITE_API_URL,
});
