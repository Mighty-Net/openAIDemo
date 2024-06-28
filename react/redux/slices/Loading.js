import { createSlice } from '@reduxjs/toolkit'

export const Loading = createSlice({
  name: 'Loading',
  initialState: {
    isLoading: false,
    isWait: false,
    title:null
  },
  reducers: {
    setIsLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setLoadingTitle: (state, action) => {
      state.title = action.payload
    },
    setIsWait: (state, action) => {
      state.isWait = action.payload
    }
  }
})

export const {setIsLoading,setLoadingTitle,setIsWait} = Loading.actions
export default Loading.reducer
