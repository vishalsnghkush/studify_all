import {PermissionsAndroid, Platform, Linking, Alert} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {getApp} from '@react-native-firebase/app';
import notifee, {AndroidStyle} from '@notifee/react-native';

const app = getApp();

async function onMessageReceived(message) {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });

  await notifee.displayNotification({
    title: message.notification.title,
    body: message.notification.body.slice(0, 20),
    android: {
      channelId,
      largeIcon: 'https://www.studifysuccess.com/images/apple-touch-icon.webp',
      style: {type: AndroidStyle.BIGTEXT, text: message.notification.body},
      color: 'cyan',
    },
  });
}

messaging().onMessage(onMessageReceived);
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
        // showPermissionSettingsAlert();
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
