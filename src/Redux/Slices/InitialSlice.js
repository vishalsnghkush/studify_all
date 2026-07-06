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
    hasUnreadDiscussion: false,
    lastSeenMsgId: 0,
  },
  reducers: {
    setTheme(state) {
      state.isDark = !state.isDark;
    },
    setUnreadDiscussion(state, action) {
      state.hasUnreadDiscussion = action.payload;
    },
    setLastSeenMsgId(state, action) {
      state.lastSeenMsgId = action.payload;
    },
    setUserLogin(state, action) {
      state.isUserLoggedIn = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setUser(state, action) {
      const wasIntern = state.user?.is_intern;
      state.user = {
        ...action.payload,
        is_intern: wasIntern !== undefined ? wasIntern : action.payload?.is_intern,
      };
    },
    setUserLogout(state) {
      state.isUserLoggedIn = false;
      state.user = {};
      state.token = '';
      state.FcmToken = null;
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
  setUser,
  setUserLogin,
  setUserLogout,
  updateUserName,
  setPermission,
  setUnreadDiscussion,
  setLastSeenMsgId,
} = initialSlice.actions;
export default initialSlice.reducer;
