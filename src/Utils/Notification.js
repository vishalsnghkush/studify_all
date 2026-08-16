import {PermissionsAndroid, Platform, Linking, Alert} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {getApp} from '@react-native-firebase/app';
import notifee, {AndroidImportance, AndroidStyle} from '@notifee/react-native';
import {Store} from './Store';
import {addNotification} from './NotificationStorage';

const app = getApp();

export const onMessageReceived = async message => {
  // console.log('from onMessageReceived', message);
  const title = message.notification?.title || message.data?.title;
  const body = message.notification?.body || message.data?.body;

  if (!title) {
    return;
  }

  try {
    const isChat = !!message?.data?.chat_group_id;
    let channelId;

    if (isChat) {
      const state = Store?.getState?.();
      const chat = state?.chat?.groups?.find(
        c => c.chat_group_id === message?.data?.chat_group_id,
      );
      const unreadCount = chat ? chat.unread_count : 0;

      channelId = await notifee.createChannel({
        id: 'chat',
        name: 'Chat Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      await notifee.displayNotification({
        id: message?.data?.chat_group_id?.toString(),
        title: title,
        body: body || 'You have a new message.',
        data: {
          ...message?.data,
          unread_count: unreadCount.toString(),
        },
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          largeIcon: 'https://www.studifysuccess.com/images/apple-touch-icon.webp',
          timestamp: Date.now(),
          showTimestamp: true,
          groupId: message?.data?.chat_group_id?.toString(),
          style: {
            type: AndroidStyle.BIGTEXT,
            text: body || 'You have a new message.',
          },
          color: 'teal',
        },
      });
    } else {
      channelId = await notifee.createChannel({
        id: 'general',
        name: 'General Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      const notifId = Date.now().toString();
      await notifee.displayNotification({
        id: notifId,
        title: title,
        body: body || 'New update available.',
        data: message?.data || {},
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          largeIcon: 'https://www.studifysuccess.com/images/apple-touch-icon.webp',
          timestamp: Date.now(),
          showTimestamp: true,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: body || 'New update available.',
          },
          color: 'teal',
        },
      });
    }

    // Save notification to local storage
    await addNotification({
      id: message.messageId || Date.now().toString(),
      title,
      body: body || '',
      timestamp: Date.now(),
      screen: message.data?.screen || '',
      url: message.data?.url || '',
    });
  } catch (error) {
    console.log('Notification Error:', error);
  }
};

export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS == 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return getFCMToken();
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        console.log('Permission Denied');
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        console.log('Permission Denied - Never ask again selected');
        showPermissionSettingsAlert();
      }
    } else {
      const authStatus = await messaging(app).requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        return getFCMToken();
      }
    }
  } catch (err) {
    console.warn(err);
  }
};

const showPermissionSettingsAlert = () => {
  Alert.alert(
    'Permission Required',
    'Please enable notifications permission from the app settings to receive notifications.',
    [
      {
        text: 'Open Settings',
        onPress: () => Linking.openSettings(),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
  );
};

const getFCMToken = async () => {
  try {
    const token = await messaging(app).getToken();
    console.log('FCM Token:--->', token);
    return token;
  } catch (error) {
    console.log('FCM error', error);
  }
};
