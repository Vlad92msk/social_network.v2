import { createSelector } from '@reduxjs/toolkit'
import { RootReducer } from './root.reducer'
import { sliceBuilder } from './utils/other'
import { UserProfileInfo } from '../../swagger/profile/interfaces-profile'

export interface ProfileSliceState {
    profile?: UserProfileInfo
}

export const profileInitialState: ProfileSliceState = {
  profile: undefined,
}

export const { actions: ProfileSliceActions, reducer: profileReducer } = sliceBuilder(
  ({ createSlice, setStateAnyObject }) => {
    const slice = createSlice({
      name: '[PROFILE]',
      initialState: profileInitialState,
      reducers: {
        setProfile: setStateAnyObject<ProfileSliceState, UserProfileInfo>('profile'),
      },
    })

    return slice
  },
)

const selectSelf = (state: RootReducer) => state.profile

export const ProfileSelectors = {
  selectProfile: createSelector(
    [selectSelf],
    (profileState) => profileState,
  ),
}
