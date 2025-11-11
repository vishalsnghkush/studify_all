import {launchImageLibrary} from 'react-native-image-picker';
import {requestImagePermissions} from './Permission';
import {pick, keepLocalCopy} from '@react-native-documents/picker';

export const PickImage = async () => {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) return null;
  const options = {mediaType: 'photo', includeBase64: false, selectionLimit: 0};
  return new Promise((resolve, reject) => {
    launchImageLibrary(options, response => {
      if (response.didCancel) resolve(null);
      else if (response.errorCode) reject(response.errorMessage);
      else resolve(response.assets);
    });
  });
};

export const PickVideo = async () => {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) return null;
  const options = {mediaType: 'video', includeBase64: false};
  return new Promise((resolve, reject) => {
    launchImageLibrary(options, response => {
      if (response.didCancel) resolve(null);
      else if (response.errorCode) reject(response.errorMessage);
      else resolve(response.assets[0]);
    });
  });
};

export const PickDoc = async () => {
  try {
    const a = await pick({
      files: ['pdf', 'doc', 'txt'],
      destination: 'cachesDirectory',
      allowMultiSelection: false,
    });
    const file = a[0];
    console.log('Picked file:', file);

    return {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name || 'document',
    };
  } catch (error) {
    console.error('Document Picker Error:', error);
    return null;
  }
};
