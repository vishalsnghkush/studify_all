import {launchImageLibrary} from 'react-native-image-picker';
import {requestImagePermissions} from './Permission';
import {pick, keepLocalCopy} from '@react-native-documents/picker';

export const PickImage = async () => {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) return null;
  const options = {mediaType: 'photo', includeBase64: false};
  return new Promise((resolve, reject) => {
    launchImageLibrary(options, response => {
      if (response.didCancel) resolve(null);
      else if (response.errorCode) reject(response.errorMessage);
      else resolve(response.assets[0]);
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
      files: ['pdf', 'doc', 'txt', 'mp4'], // added mp4 if you want video too
      destination: 'cachesDirectory',
      allowMultiSelection: false,
    });
    const result = a[0];
    console.log('Picker result:', result);

    const file = result;
    console.log('Picked file:', file);

    // Create a local copy
    const localFile = await keepLocalCopy(file);
    console.log('Local copy:', localFile);

    return {
      uri: localFile.fileCopyUri ?? file.uri, // fallback if keepLocalCopy fails
      type: file.type || 'application/octet-stream',
      name: file.name || 'document',
    };
  } catch (error) {
    console.error('Document Picker Error:', error);
    return null;
  }
};
