import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { profileApiInstance } from "../instanse";


export const profileApi = createApi({
  reducerPath: 'profile',
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
        getProfileInfo: builder.query<
          ReturnType<typeof profileApiInstance.getProfileInfo>,
          Parameters<typeof profileApiInstance.getProfileInfoInit>[0]
        >({
          // query: profileApiInstance.getProfileInfoInit,
          query: (params) => {
              const {url, ...rest} = profileApiInstance.getProfileInfoInit(params)
              return ({ url, ...rest })
          },
        }),
  }),
});
