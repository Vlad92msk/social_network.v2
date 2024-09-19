import { createSelector } from '@reduxjs/toolkit'
import { userInfoApi } from './api'
import { RootReducer } from './root.reducer'
import { sliceBuilder } from './utils/other'
import { UserInfo, UserProfileInfo } from '../../swagger/profile/interfaces-profile'

export interface ProfileSliceState {
    profile?: UserProfileInfo
}

export const profileInitialState: ProfileSliceState = {
  profile: undefined,
}

export const { actions: ProfileSliceActions, reducer: profileReducer } = sliceBuilder(
  ({ createSlice, setStateAnyObject }) => createSlice({
    name: '[PROFILE]',
    initialState: profileInitialState,
    reducers: {
      setProfile: setStateAnyObject<ProfileSliceState, UserProfileInfo>('profile'),
      setUserInfo: setStateAnyObject<ProfileSliceState, UserInfo>('profile.user_info'),
    },
    extraReducers: (builder) => {
      builder
        // Реагируем на успешное выполнение мутации updateUser
        .addMatcher(
          userInfoApi.endpoints.updateUser.matchFulfilled,
          (state, action) => {
            if (state.profile && state.profile.user_info) {
              state.profile.user_info = {
                ...state.profile.user_info,
                ...action.payload
              };
            } else if (state.profile) {
              state.profile.user_info = action.payload;
            }
          }
        )
        // Реагируем на НЕ успешное выполнение мутации updateUser
        .addMatcher(
          userInfoApi.endpoints.updateUser.matchRejected,
          (state, action) => {
            if (state.profile && state.profile.user_info) {
              state.profile.user_info = state?.profile.user_info;
            }
          }
        )
    },
  }),
)

const selectSelf = (state: RootReducer) => state.profile

export const ProfileSelectors = {
  selectProfile: createSelector(
    [selectSelf],
    (profileState) => profileState,
  ),
}
