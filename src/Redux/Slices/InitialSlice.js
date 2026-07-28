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
      // AsyncStorage role controls is_intern/is_tl.
      // If state already has a role set to true, NEVER let an API response set it back to false.
      // Only allow changing to true or keeping true. Role can only be cleared on logout.
      const wasIntern = state.user?.is_intern === true;
      const wasTl = state.user?.is_tl === true;
      const payloadIsIntern = action.payload?.is_intern === true;
      const payloadIsTl = action.payload?.is_tl === true;
      state.user = {
        ...action.payload,
        is_intern: wasIntern || payloadIsIntern,
        is_tl: wasTl || payloadIsTl,
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
