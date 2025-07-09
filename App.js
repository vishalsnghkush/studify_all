import 'react-native-gesture-handler';
import Main from './src/app';
import {Provider} from 'react-redux';
import {Store, persistor} from './src/Utils/Store';
import {PersistGate} from 'redux-persist/integration/react';
import {useEffect} from 'react';
import SplashScreen from 'react-native-splash-screen';
import messaging from '@react-native-firebase/messaging';
import {onMessageReceived} from './src/Utils/Notification';

const App = () => {
  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hide();
    }, 1000);

    const unsubscribe = messaging().onMessage(onMessageReceived);
    return unsubscribe;
  }, []);

  return (
    <Provider store={Store}>
      <PersistGate loading={null} persistor={persistor}>
        <Main />
      </PersistGate>
    </Provider>
  );
};

export default App;
