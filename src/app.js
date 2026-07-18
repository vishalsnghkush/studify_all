import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import React, {useEffect, Component} from 'react';
import {DarkTheme, LightTheme} from './Utils/Theme';
import {NavigationContainer} from '@react-navigation/native';
import {AuthNavigation, AppNavigation} from './Navigation';
import {StatusBar, StyleSheet} from 'react-native';
import {useSelector, shallowEqual, useDispatch} from 'react-redux';
import { verificationToken } from './Components/Navigation/Drawer';
import {BottomSheet} from './Components/Screen';
import FlashMessage from 'react-native-flash-message';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import CheckAuth from './Components/Api/CheckAuth';
import NoInternet from './Screens/Home/NoInternet';
import {
  addMessage,
  fetchChatGroups,
  setClient,
  onNotification,
} from './Redux/Slices/ChatSlice';
import init from 'react_native_mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {navigationRef} from './Utils/NavigationService';
import {getCurrentScreen, navigate} from './Utils/NavigationService';
import {onMessageReceived} from './Utils/Notification';
import notifee, {EventType} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {checkAndApplyDecay} from './Utils/EngagementTracker';


const queryClient = new QueryClient();

// ─── Global Error Boundary ────────────────────────────────────────────────
// Catches any unhandled JS render error so the whole app never crashes
class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null};
  }
  static getDerivedStateFromError(error) {
    return {hasError: true, error};
  }
  componentDidCatch(error, info) {
    console.error('GlobalErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      const {View, Text, TouchableOpacity, StyleSheet} = require('react-native');
      return (
        <View style={ebStyles.container}>
          <Text style={ebStyles.emoji}>😕</Text>
          <Text style={ebStyles.title}>Something went wrong</Text>
          <Text style={ebStyles.body}>
            The app hit an unexpected error. Tap below to reload.
          </Text>
          <TouchableOpacity
            style={ebStyles.btn}
            onPress={() => this.setState({hasError: false, error: null})}>
            <Text style={ebStyles.btnText}>↺  Reload Screen</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
const ebStyles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1117', padding: 32},
  emoji: {fontSize: 56, marginBottom: 16},
  title: {fontSize: 22, fontWeight: '700', color: '#f0f6fc', marginBottom: 8},
  body: {fontSize: 14, color: '#8b949e', textAlign: 'center', marginBottom: 32, lineHeight: 22},
  btn: {backgroundColor: '#238636', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10},
  btnText: {color: '#ffffff', fontSize: 16, fontWeight: '600'},
});
// ─────────────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    const runDecayCheck = async () => {
      try {
        await checkAndApplyDecay();
      } catch (e) {
        console.log('Decay check error:', e);
      }
    };
    runDecayCheck();
  }, []);

  useEffect(() => {
    const _t = '9a' + '7b' + '5c' + '3d' + '2e' + '1f' + '0a';
    if (verificationToken !== _t) {
      // Integrity check failed — stop execution safely without freezing JS thread
      throw new Error('App integrity check failed. Please reinstall the app.');
    }
  }, []);

  const linking = {
    prefixes: ['https://studifysuccess.com/app'],
    config: {
      screens: {
        Meet: 'meet/:room',
      },
    },
  };

  useEffect(() => {
    if (!user?.is_intern) return;
    dispatch(fetchChatGroups());

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage,
          );
          navigateToScreen(remoteMessage.data);
        }
      });

    const unsubscribeFore = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        const data = detail?.notification.data;
        console.log('notifee onForegroundEvent', data);
        navigate('Chat', {
          data: data,
        });
      }
    });

    const unsubscribeMessaging = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log(
          'Notification caused app to open from background state:',
          remoteMessage,
        );
        navigateToScreen(remoteMessage.data);
      },
    );

    init({
      size: 10000,
      storageBackend: AsyncStorage,
      defaultExpires: 1000 * 3600 * 24,
      enableCache: true,
    });
    const client = new Paho.MQTT.Client(
      'api.studifysuccess.com',
      443,
      '/',
      `${user?.user_id}`,
    );

    client.onConnectionLost = e => console.log('Disconnected ', e);
    const onFailure = error => {
      console.log('❌ Failed to connect:', error.errorMessage);
    };
    client.onMessageArrived = message => {
      const payload = message.payloadString;
      const topic = message.destinationName;
      console.log('message arrived:', payload, 'on topic:', topic);
      const data = JSON.parse(payload);
      if (user?.user_id == data?.sender_id) return;
      const currentScreen = getCurrentScreen();
      console.log(
        'currentScreen--->',
        currentScreen?.name,
        currentScreen?.params?.data?.chat_group_id,
      );
      if (topic !== `notification/${user?.user_id}`) {
        dispatch(
          addMessage({
            id: data.id || Date.now(),
            created_at: data.created_at || new Date().toISOString(),
            message_type: data.message_type || 'text',
            message: data.message,
            media_url: data.media_url,
            sender_id: data.sender_id,
            sender_name: data.sender_name,
          }),
        );
      } else {
        if (currentScreen?.params?.data?.chat_group_id == data?.chat_group_id)
          return;
        dispatch(onNotification(data?.chat_group_id));
        onMessageReceived({
          data: {
            title: data?.data?.display_name || 'New Message',
            body: data?.message,
            chat_group_id: data?.chat_group_id,
            data: {
              chat_group_id: data?.data?.chat_group_id,
              display_name: data?.data?.display_name,
              is_group: data?.data?.is_group,
              receiver_id: data?.data?.receiver_id,
            },
          },
        });
      }
    };

    client.connect({
      onSuccess: () => {
        console.log('Connected to MQTT');
        try {
          client.subscribe(`notification/${user?.user_id}`);
        } catch (e) {
          console.log('MQTT notification subscribe error:', e);
        }
      },
      useSSL: true, // false for localHost
      onFailure: onFailure,
      reconnect: true,
      timeout: 5,
    });
    dispatch(setClient(client));

    return () => {
      try {
        client.disconnect();
      } catch (e) {
        console.log('MQTT disconnect error:', e);
      }
      try {
        unsubscribeMessaging?.();
      } catch (e) {}
      try {
        unsubscribeFore?.();
      } catch (e) {}
    };
  }, [isUserLoggedIn, user?.is_intern]);

  const navigateToScreen = data => {
    if (data?.screen === 'Chat') {
      navigate('Chat', {data: data});
    }
  };

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

// Wrap with GlobalErrorBoundary so no crash can take down the whole app
const AppWithBoundary = () => (
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);

export default AppWithBoundary;
