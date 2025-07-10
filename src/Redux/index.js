import {combineReducers} from '@reduxjs/toolkit';
import InitialReducer from './Slices/InitialSlice';
import ModalReducer from './Slices/ModalSlice';
import ChatReducer from './Slices/ChatSlice';

const RootReducer = combineReducers({
  initial: InitialReducer,
  modal: ModalReducer,
  chat: ChatReducer,
});

export default RootReducer;
