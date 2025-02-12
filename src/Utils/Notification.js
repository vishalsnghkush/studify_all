import {PermissionsAndroid, Platform, Linking, Alert} from 'react-native';
import messaging from '@react-native-firebase/messaging';

export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS == 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      // console.log("grantedgranted", granted);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return getFCMToken();
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        console.log('Permission Denied');
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        console.log('Permission Denied - Never ask again selected');
        // Guide the user to enable the permission manually
        showPermissionSettingsAlert();
      }
    } else {
      const authStatus = await messaging().requestPermission();
      // await requestNotificationPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // console.log("Authorization status:", authStatus);
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
    // await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    console.log('token->>', token);
    return token;
  } catch (error) {
    console.log('FCM error', error);
  }
};
