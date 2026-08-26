import React, {useEffect, useState} from 'react';
import {Button} from '../../Components/Input';
import auth from '@react-native-firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {useDispatch, useSelector} from 'react-redux';
import {getApp} from '@react-native-firebase/app';
import useApi from '../../Components/Api/Api';
import {setUserLogin} from '../../Redux/Slices/InitialSlice';
import FlashMessage from '../../Components/Screen/FlashMessage';
import DeviceInfo from 'react-native-device-info';
const Google = ({ selectedRole }) => {
  const [loading, setLoading] = useState(false);
  let brand = DeviceInfo.getBrand();
  let model = DeviceInfo.getModel();
  let androidVersion = DeviceInfo.getSystemVersion();
  const dispatch = useDispatch();
  const app = getApp();
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '754353284004-474eirfunp8osjpcmqr8ut6b31o7ajq1.apps.googleusercontent.com',
    });
  }, []);
  const onGoogleButtonPress = async () => {
    setLoading(true);
    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      // console.log('Google response', user);
      const res = await useApi().post('/auth/googleSignup', {
        email: user.data.user.email,
        fname: user.data.user.givenName,
        lname: user?.data?.user?.familyName || ' ',
        brand: brand,
        model: model,
        androidVersion: androidVersion,
        is_intern: selectedRole === 'intern',
        is_tl: selectedRole === 'tl',
      });
      // console.log('profile updated', res);
      if (res.status == 200) {
        const cleanEmail = (user.data?.user?.email || res.data?.user?.email || '').trim().toLowerCase();
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        let savedRole = await AsyncStorage.getItem(`@studify_role_${cleanEmail}`);

        const isTl = res.data.user?.is_tl === 1 || res.data.user?.is_tl === true;
        const isIntern = res.data.user?.is_intern === 1 || res.data.user?.is_intern === true;

        if (cleanEmail) {
          const finalRole = isTl ? 'tl' : isIntern ? 'intern' : 'student';
          await AsyncStorage.setItem(`@studify_role_${cleanEmail}`, finalRole);
        }

        const updatedUser = {
          ...res.data.user,
          is_intern: isIntern && !isTl,
          is_tl: isTl,
        };
        dispatch(
          setUserLogin({
            token: res.data.token,
            user: updatedUser,
          }),
        );
      } else {
        FlashMessage({
          message: 'Google login failed, please try again',
          type: 'danger',
        });
      }
      const googleCredential = auth.GoogleAuthProvider.credential(
        user.data.idToken,
      );
      return auth(app).signInWithCredential(googleCredential);
    } catch (error) {
      let errorMessage = 'Google Sign-In failed';
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'User cancelled the sign-in';
        console.log('User cancelled the sign-in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign-in in progress';
        console.log('Sign-in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Play services not available or outdated';
        console.log('Play services not available or outdated');
      } else {
        errorMessage = error.message || 'An unexpected error occurred during Google Sign-in';
        console.error(error);
      }
      FlashMessage({
        message: errorMessage,
        type: 'danger',
      });
    }
    setLoading(false);
  };

  return (
    <Button
      mode="outlined"
      name="Sign in with Google"
      icon="google"
      loading={loading}
      onPress={onGoogleButtonPress}
      style={{marginBottom: 15}}
    />
  );
};

export default Google;
