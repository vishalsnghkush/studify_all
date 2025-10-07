import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootReducer from '../Redux';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['initial'],
  // blacklist: ['key3', 'key4'],
};

const persistedReducer = persistReducer(persistConfig, RootReducer);

export const Store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
export const persistor = persistStore(Store);
