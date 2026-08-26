import {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {
  addMessage,
  fetchChatGroups,
  setClient,
  onNotification,
} from '../../Redux/Slices/ChatSlice';
import init from 'react_native_mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getCurrentScreen, navigate} from '../../Utils/NavigationService';
import {onMessageReceived} from '../../Utils/Notification';
import notifee, {EventType} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

const Mqtt = () => {
  const dispatch = useDispatch();
  const {user} = useSelector(state => ({
    user: state.initial.user,
  }));

  useEffect(() => {
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

    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage,
      );
      navigateToScreen(remoteMessage.data);
    });

    if (!user) return;
    dispatch(fetchChatGroups());
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
            id: Date.now(),
            created_at: data?.created_at,
            message_type: data?.message_type,
            message: data?.message,
            media_url: data?.media_url,
            sender_id: data?.sender_id,
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
            // data: data.data,
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
        client.subscribe(`notification/${user?.user_id}`);
      },
      useSSL: true, // false for localHost
      onFailure: onFailure,
      // reconnect: true,
      // timeout: 5,
    });
    dispatch(setClient(client));

    const unsubscribeFore = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        const data = detail?.notification.data;
        console.log('notifee onForegroundEvent', data);
        navigate('Chat', {
          data: data,
        });
      }
    });

    notifee.onBackgroundEvent(async ({type, detail}) => {
      if (type === EventType.PRESS) {
        const data = detail?.notification.data;
        console.log('notifee onBackgroundEvent', data);
        navigate('Chat', {
          data: data,
        });
      }
    });

    return () => {
      client.disconnect();
      unsubscribe();
      unsubscribeFore();
    };
  }, [user]);

  const navigateToScreen = data => {
    if (data?.screen === 'Chat') {
      navigate('Chat', {data: data});
    }
  };
};

export default Mqtt;
