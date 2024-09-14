import { UserProfileInfo } from '../../../swagger/profile/interfaces-profile'
import { sliceBuilder } from './utils/other'

export interface ProfileSliceState {
    profile: UserProfileInfo | null
}



export const { actions: ProfileSliceActions, reducer: profileReducer } = sliceBuilder(
  ({ createSlice, setStateAnyObject }) => {
    const initialState: ProfileSliceState = {
      profile: null,
    }

    return createSlice({
      name: '[PROFILE]',
      initialState,
      reducers: {
        setProfile: setStateAnyObject<ProfileSliceState, UserProfileInfo>('profile'),
      },
    })
  },
)

