import { createSlice } from '@reduxjs/toolkit'

export const Saving = createSlice({
  name: 'Saving',
  initialState: {
    isSaveSuccess: false,
    isSaveValid: false,
    saveRequest:false
  },
  reducers: {
    setsaveSuccess: (state, action) => {
      state.isSaveSuccess = action.payload
    },
    setsaveValid: (state, action) => {
      state.isSaveValid = action.payload
    },
    setsaveRequest: (state, action) => {
      state.saveRequest = action.payload
    }
  }
})

export const {setsaveSuccess,setsaveValid,setsaveRequest} = Saving.actions
export default Saving.reducer
