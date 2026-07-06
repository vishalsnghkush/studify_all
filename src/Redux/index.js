import {combineReducers} from '@reduxjs/toolkit';
import InitialReducer from './Slices/InitialSlice';
import ModalReducer from './Slices/ModalSlice';
import ChatReducer from './Slices/ChatSlice';
import GamificationReducer from './Slices/GamificationSlice';

const RootReducer = combineReducers({
  initial: InitialReducer,
  modal: ModalReducer,
  chat: ChatReducer,
  gamification: GamificationReducer,
});

export default RootReducer;
