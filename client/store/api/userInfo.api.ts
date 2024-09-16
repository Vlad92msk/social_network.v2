
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CookieType } from '../../app/types/cookie';
import { RootState } from '../store'
import { userInfoApiInstance } from '../../store/instance';
import { UserAbout, UserInfoDto, UpdateUserAboutDto, UpdateUserDto } from '../../../swagger/userInfo/interfaces-userInfo';

export const userInfoApi = createApi({
  reducerPath: 'API_userInfo',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const profileId = state.profile?.profile?.id;
      const userInfoId = state.profile?.profile?.user_info?.id;

      if (profileId) {
        headers.set(CookieType.USER_PROFILE_ID, String(profileId));
      }
      if (userInfoId) {
        headers.set(CookieType.USER_INFO_ID, String(userInfoId));
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({

    getUsers: builder.query<
      UserInfoDto[],
      Parameters<typeof userInfoApiInstance.getUsers>[0]
    >({
      query: (params) => {
        const { url, init } = userInfoApiInstance.getUsersInit(params);
        return { url, ...init };
      },
    }),

    updateUser: builder.mutation<
      UserInfoDto,
      Parameters<typeof userInfoApiInstance.updateUser>[0]
    >({
      query: (params) => {
        const { url, init } = userInfoApiInstance.updateUserInit(params);
        return { url, ...init };
      },
    }),

    getUserById: builder.query<
      UserInfoDto,
      Parameters<typeof userInfoApiInstance.getUserById>[0]
    >({
      query: (params) => {
        const { url, init } = userInfoApiInstance.getUserByIdInit(params);
        return { url, ...init };
      },
    }),
  }),
});
