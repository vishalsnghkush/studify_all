import {PermissionsAndroid, Platform, Linking, Alert} from 'react-native';

export const getAllContacts = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
      console.log('Permission Denied');
    } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      console.log('Permission Denied - Never ask again selected');
      // Guide the user to enable the permission manually
      // showPermissionSettingsAlert();
    }
  } catch (err) {
    console.warn(err);
  }
};

const showPermissionSettingsAlert = () => {
  Alert.alert('Permission Required', 'Please enable contacts permission', [
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
