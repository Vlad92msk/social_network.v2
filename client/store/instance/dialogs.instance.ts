import { DialogsApi } from "../../../swagger/dialogs/api-client-dialogs";

export const dialogsApiInstance = new DialogsApi({
  baseUrl: process.env.DB_URL
});
