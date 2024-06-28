import { createSlice } from '@reduxjs/toolkit'

export const UserInfo = createSlice({
  name: 'UserInfo',
  initialState: {
    "account":null,
    "organizationID": [],
    "mobilePhone": null,
    "firstName": null,
    "lastName": null,
    "locale":null,
    "regionCode": null,
    "accountType":null,
    "UID":null
  },
  reducers: {
    setUserInfo: (state, action) => {
      return action.payload;
    },
  }
})

export const { setUserInfo } = UserInfo.actions
export default UserInfo.reducer
