import {PermissionsAndroid, Alert, Linking, Platform} from "react-native";

export const requestImagePermissions = async () => {
  try {
    const permission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const granted = await PermissionsAndroid.request(permission, {
      title: "Media Access Permission",
      message: "We need access to your photos to upload images.",
      buttonPositive: "OK",
      buttonNegative: "Cancel",
    });

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Media permission granted");
      return true;
    } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert(
        "Permission Required",
        "To use this feature, enable permissions in app settings.",
        [
          {text: "Cancel", style: "cancel"},
          {text: "Open Settings", onPress: () => Linking.openSettings()},
        ],
      );
      return false;
    } else {
      Alert.alert(
        "Permission Denied",
        "Media access is required for this feature.",
      );
      return false;
    }
  } catch (error) {
    console.warn(error);
    return false;
  }
};
