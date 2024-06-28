import { createSlice } from '@reduxjs/toolkit'

export const ThemeMode = createSlice({
  name: 'ThemeMode',
  initialState: {
    mode: 'dark'
  },
  reducers: {
    setThemeMode: (state, action) => {
      state.mode = action.payload
    }
  }
})

export const {setThemeMode} = ThemeMode.actions
export default ThemeMode.reducer
