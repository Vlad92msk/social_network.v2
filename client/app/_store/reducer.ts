import { combineReducers, Reducer } from '@reduxjs/toolkit';
import { RootState } from "./state";
import { counterSlice } from "./messagesReducer";

export const rootReducer: Reducer<RootState> = combineReducers({
    counter: counterSlice.reducer,
});
