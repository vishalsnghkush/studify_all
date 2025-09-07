import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import useApi from '../../Components/Api/Api';

export const fetchChatGroups = createAsyncThunk(
  'mqtt/fetchChatGroups',
  async (_, {rejectWithValue}) => {
    try {
      const res = await useApi().get('/chat/groups');
      // console.log('Fetched chat groups:', res);
      const groups = res?.data;
      if (!Array.isArray(groups))
        return rejectWithValue('Invalid groups response');
      return groups;
    } catch (e) {
      return rejectWithValue(e.message || 'Failed to load groups');
    }
  },
);

const initialState = {
  client: null,
  messages: [],
  groups: [],
  loadingGroups: false,
  groupsError: null,
};

const mqttSlice = createSlice({
  name: 'mqtt',
  initialState,
  reducers: {
    setClient(state, action) {
      state.client = action.payload;
    },
    addMessage(state, action) {
      state.messages = [action.payload, ...state.messages];
    },
    setGroups(state, action) {
      state.groups = action.payload;
    },
    onSelectGroup(state, action) {
      const groupId = action.payload;
      state.groups = state.groups.map(g =>
        g.chat_group_id === groupId ? {...g, unread_count: 0} : g,
      );
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchChatGroups.pending, state => {
        state.loadingGroups = true;
        state.groupsError = null;
      })
      .addCase(fetchChatGroups.fulfilled, (state, action) => {
        state.loadingGroups = false;
        state.groups = action.payload;
      })
      .addCase(fetchChatGroups.rejected, (state, action) => {
        state.loadingGroups = false;
        state.groupsError =
          action.payload || action.error.message || 'Failed to load groups';
      });
  },
});

export const {setClient, addMessage, setGroups, onSelectGroup} =
  mqttSlice.actions;
export default mqttSlice.reducer;
