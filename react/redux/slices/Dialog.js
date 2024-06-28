import { createSlice } from '@reduxjs/toolkit'

export const Dialog = createSlice({
  name: 'Dialog',
  initialState: {
    visible: false,
    freezer: false,
    setting:{
      title: "",
      des:"",
      onConfirm:null,
      onCancel:null,
      ConfirmText:null,
      CancelText:null,
      type:0,
      stayFreeze:false
    }
  },
  reducers: {
    setDialog: (state, action) => {
      state.setting = action.payload 
    },
    setDialogVisible: (state, action) => {
      state.visible = action.payload
    },
    setFreezerVisible: (state, action) => {
      state.freezer = action.payload
    }
  }
})

export const {setDialog,setDialogVisible,setFreezerVisible} = Dialog.actions
export default Dialog.reducer
