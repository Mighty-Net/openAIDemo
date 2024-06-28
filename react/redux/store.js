import { configureStore } from '@reduxjs/toolkit'
import Loading from './slices/Loading'
import Dialog from './slices/Dialog'
import ThemeMode from './slices/ThemeMode'
import Saving from './slices/Saving'
import UserInfo from './slices/UserInfo'




export default configureStore({
  reducer: {
    Loading:Loading,
    Dialog:Dialog,
    ThemeMode:ThemeMode,
    Saving:Saving,
    UserInfo:UserInfo,
  }
})
