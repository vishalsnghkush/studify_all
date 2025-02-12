import 'react-native-gesture-handler';
import Main from './src/app';
import {Provider} from 'react-redux';
import {Store, persistor} from './src/Utils/Store';
import {PersistGate} from 'redux-persist/integration/react';
import {useEffect} from 'react';
import SplashScreen from 'react-native-splash-screen';
import {requestNotificationPermission} from './src/Utils/Notification';
import {getAllContacts} from './src/Utils/Contacts.';
const App = () => {
  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hide();
    }, 1500);
    // requestNotificationPermission();
    // getAllContacts().then(e => console.log(JSON.stringify(e)));
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
