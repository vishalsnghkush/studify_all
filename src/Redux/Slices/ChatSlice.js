import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  client: null,
  messages: [],
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
  },
});

export const {setClient, addMessage} = mqttSlice.actions;
export default mqttSlice.reducer;
