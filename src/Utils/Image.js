import {PermissionsAndroid, Linking, Alert} from 'react-native';

export const getImagesPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES ||
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
      console.log('Permission Denied');
    } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      console.log('Permission Denied - Never ask again selected');
      showPermissionSettingsAlert();
    }
  } catch (err) {
    console.warn(err);
  }
};

const showPermissionSettingsAlert = () => {
  Alert.alert('Permission Required', 'Please enable media permissions', [
    {
      text: 'Open Settings',
      onPress: () => Linking.openSettings(),
    },
    {
      text: 'Cancel',
      style: 'cancel',
    },
  ]);
};
