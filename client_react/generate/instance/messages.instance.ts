import { MessagesApi } from "../../../swagger/messages/api-client-messages.ts";

export const messagesApiInstance = new MessagesApi({
  baseUrl: import.meta.env.VITE_API_URL,
});
