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
      const wasIntern = state.user?.is_intern === 1 || state.user?.is_intern === true;
      const wasTl = state.user?.is_tl === 1 || state.user?.is_tl === true;
      const wasDept = state.user?.department;
      const payloadIsIntern = action.payload?.is_intern === 1 || action.payload?.is_intern === true;
      const payloadIsTl = action.payload?.is_tl === 1 || action.payload?.is_tl === true;
      // If the payload explicitly carries role info (from savedRole at login or CheckAuth),
      // trust the payload's role completely — do NOT OR with stale state flags.
      // Only fall back to previous state flags when the payload has NO role keys at all
      // (e.g. a partial profile update that doesn't touch roles).
      const payloadHasRole =
        action.payload !== null &&
        action.payload !== undefined &&
        ('is_intern' in action.payload || 'is_tl' in action.payload);
      state.user = {
        ...action.payload,
        is_intern: payloadHasRole ? payloadIsIntern : wasIntern,
        is_tl: payloadHasRole ? payloadIsTl : wasTl,
        department: action.payload?.department !== undefined ? action.payload.department : wasDept,
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
