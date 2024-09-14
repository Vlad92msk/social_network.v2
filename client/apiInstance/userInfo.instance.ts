import { UserInfoApi } from "../../swagger/userInfo/api-client-userInfo";

export const userInfoApiInstance = new UserInfoApi({
  baseUrl: process.env.DB_URL
});
