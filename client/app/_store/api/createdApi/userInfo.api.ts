import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { userInfoApiInstance } from "../instanse";


export const userInfoApi = createApi({
  reducerPath: 'userInfo',
  baseQuery: fetchBaseQuery({
    // baseUrl: '',
    // prepareHeaders: (headers, { getState }) => {
    //   // @ts-ignore
    //   const token = (getState()).auth.token;
    //   if (token) {
    //     headers.set('authorization', `Bearer ${token}`);
    //   }
    //   return headers;
    // },
  }),
  endpoints: (builder) => ({
        getUsers: builder.query<
          ReturnType<typeof userInfoApiInstance.getUsers>,
          Parameters<typeof userInfoApiInstance.getUsersInit>[0]
        >({
          // query: userInfoApiInstance.getUsersInit,
          query: (params) => {
              const {url, ...rest} = userInfoApiInstance.getUsersInit(params)
              return ({ url, ...rest })
          },
        }),
    updateUser: builder.mutation<
          ReturnType<typeof userInfoApiInstance.updateUser>,
          Parameters<typeof userInfoApiInstance.updateUserInit>[0]
        >({
          // query: userInfoApiInstance.updateUserInit,
          query: (params) => {
              const {url, ...rest} = userInfoApiInstance.updateUserInit(params)
              return ({ url, ...rest })
          },
        }),
    getUserById: builder.query<
          ReturnType<typeof userInfoApiInstance.getUserById>,
          Parameters<typeof userInfoApiInstance.getUserByIdInit>[0]
        >({
          // query: userInfoApiInstance.getUserByIdInit,
          query: (params) => {
              const {url, ...rest} = userInfoApiInstance.getUserByIdInit(params)
              return ({ url, ...rest })
          },
        }),
  }),
});
