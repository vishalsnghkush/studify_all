import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import React, {useEffect} from 'react';
import {DarkTheme, LightTheme} from './Utils/Theme';
import {NavigationContainer} from '@react-navigation/native';
import {AuthNavigation, AppNavigation} from './Navigation';
import {StatusBar} from 'react-native';
import {useSelector, shallowEqual, useDispatch} from 'react-redux';
import {BottomSheet} from './Components/Screen';
import FlashMessage from 'react-native-flash-message';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import CheckAuth from './Components/Api/CheckAuth';
import NoInternet from './Screens/Home/NoInternet';
import {addMessage, setClient} from './Redux/Slices/ChatSlice';
import init from 'react_native_mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {navigationRef} from './Utils/NavigationService';
import {getCurrentScreen, navigate} from './Utils/NavigationService';
import {onMessageReceived} from './Utils/Notification';
import notifee, {EventType} from '@notifee/react-native';

const queryClient = new QueryClient();
const LightMode = {
  ...MD3LightTheme,
  colors: LightTheme,
};
const DarkMode = {
  ...MD3DarkTheme,
  colors: DarkTheme,
};

const App = () => {
  const dispatch = useDispatch();
  const {user, isDark, isUserLoggedIn} = useSelector(
    state => ({
      isDark: state.initial.isDark,
      isUserLoggedIn: state.initial.isUserLoggedIn,
      user: state.initial.user,
    }),
    shallowEqual,
  );
  const theme = isDark ? DarkMode : LightMode;

  const linking = {
    prefixes: ['https://studifysuccess.com/app'],
    config: {
      screens: {
        Meet: 'meet/:room',
      },
    },
  };

  useEffect(() => {
    init({
      size: 10000,
      storageBackend: AsyncStorage,
      defaultExpires: 1000 * 3600 * 24,
      enableCache: true,
    });

    if (!isUserLoggedIn) return;
    const client = new Paho.MQTT.Client(
      'ss-backend-amuk.onrender.com', // IP for local testing
      443,
      '/',
      'ankit',
    );

    client.onConnectionLost = e => console.log('Disconnected ', e);
    const onFailure = error => {
      console.log('❌ Failed to connect:', error.errorMessage);
    };
    client.onMessageArrived = message => {
      const payload = message.payloadString;
      const topic = message.destinationName;
      console.log('Message arrived:', payload, 'on topic:', topic);
      const data = JSON.parse(payload);
      if (data?.sender === user?.email) return;
      const currentScreen = getCurrentScreen();
      console.log('currentScreen--->', currentScreen);
      dispatch(
        addMessage({
          _id: Date.now(),
          text: data.text,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: data?.sender,
          },
        }),
      );
      if (currentScreen !== 'CustomerService') {
        onMessageReceived({
          data: {
            title: data?.sender,
            body: data.text,
          },
        });
      }
    };

    client.connect({
      onSuccess: () => {
        console.log('Connected to MQTT');
        client.subscribe('chat/general');
      },
      useSSL: true, // false for localHost
      onFailure: onFailure,
      reconnect: true,
    });
    dispatch(setClient(client));

    const unsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        // console.log('data', detail);
        navigate('CustomerService');
      }
    });

    return () => {
      client.disconnect();
      unsubscribe();
    };
  }, [isUserLoggedIn]);

  return (
    <PaperProvider theme={theme}>
      <CheckAuth />
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <NavigationContainer linking={linking} ref={navigationRef}>
        <QueryClientProvider client={queryClient}>
          {isUserLoggedIn ? <AppNavigation /> : <AuthNavigation />}
        </QueryClientProvider>
      </NavigationContainer>
      <BottomSheet />
      <FlashMessage />
      <NoInternet />
    </PaperProvider>
  );
};

export default App;
