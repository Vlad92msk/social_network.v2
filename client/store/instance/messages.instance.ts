import { MessagesApi } from "../../../swagger/messages/api-client-messages";

export const messagesApiInstance = new MessagesApi({
  baseUrl: process.env.DB_URL
});
