import { createSelector } from '@reduxjs/toolkit'
import { UserProfileInfo } from '../../swagger/profile/interfaces-profile'
import { RootReducer } from './root.reducer'
import { sliceBuilder } from './utils/other'

export interface ProfileSliceState {
    profile: UserProfileInfo | null
  a?: string
}

export const profileInitialState: ProfileSliceState = {
  profile: null,
  a: '34'
}

export const { actions: ProfileSliceActions, reducer: profileReducer, selectors: ProfileSelectors } = sliceBuilder(
  ({ createSlice, setStateAnyObject }) => {

    const slice = createSlice({
      name: '[PROFILE]',
      initialState: profileInitialState,
      reducers: {
        setProfile: setStateAnyObject<ProfileSliceState, UserProfileInfo>('profile'),
      },
    })

    const selectSelf = (state: RootReducer) => state.profile
    const selectSelf1 = (state: RootReducer) => state.API_tags.queries

    const selectors = {
      selectProfile: createSelector(
        [selectSelf, selectSelf1],
        (profileState, d) => profileState
      ),
    }

    return ({ ...slice, selectors })
  },
)
