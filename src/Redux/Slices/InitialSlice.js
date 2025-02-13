import {createSlice} from '@reduxjs/toolkit';

const initialSlice = createSlice({
  name: 'initial',
  initialState: {
    isDark: false,
    isUserLoggedIn: false,
    user: {},
    token: '',
    FcmToken: null,
    contactPermission: false,
    notificationPermission: false,
    audioPremisson: false,
    videoPermission: false,
  },
  reducers: {
    setTheme(state) {
      state.isDark = !state.isDark;
    },
    setUserLogin(state, action) {
      state.isUserLoggedIn = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setUserLogout(state) {
      state.isUserLoggedIn = false;
      state.user = {};
      state.token = '';
    },
    updateUserName(state, action) {
      state.user.fname = action.payload.fname;
      state.user.lname = action.payload.lname;
    },
    setPermission(state, action) {
      state[action.payload.permission] = action.payload.value;
      if (action.payload.permission == 'notificationPermission') {
        state.FcmToken = action.payload.FcmToken;
      }
    },
  },
});

export const {
  setTheme,
  setUserLogin,
  setUserLogout,
  updateUserName,
  setPermission,
} = initialSlice.actions;
export default initialSlice.reducer;
