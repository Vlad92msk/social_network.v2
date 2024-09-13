import { sliceBuilder } from './utils/other'

export interface CounterState {
    value: number
}



export const { actions: CounterSliceActions, reducer: counterReducer } = sliceBuilder(
  ({ moduleEnter, moduleExit, createSlice, setState }) => {
    const initialState: CounterState = {
      value: 0,
    }

    return createSlice({
      name: '[ECJOURNAL/GRID]',
      initialState,
      reducers: {
        enter: moduleEnter<CounterState>(),
        exit: moduleExit(initialState),

        setGroupId: setState<CounterState, number>('value'),
      },
    })
  },
)

