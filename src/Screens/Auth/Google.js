import React, {useEffect} from 'react';
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
const Google = () => {
  let brand = DeviceInfo.getBrand();
  let model = DeviceInfo.getModel();

  const dispatch = useDispatch();
  const app = getApp();
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '754353284004-474eirfunp8osjpcmqr8ut6b31o7ajq1.apps.googleusercontent.com',
    });
  }, []);
  const onGoogleButtonPress = async () => {
    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn({prompt: 'select_account'});
      // console.log('Google response', user);
      const res = await useApi().post('/auth/googleSignup', {
        email: user.data.user.email,
        fname: user.data.user.givenName,
        lname: user?.data?.user?.familyName || ' ',
        brand: brand,
        model: model,
      });
      console.log('profile updated', res);
      if (res.status == 200) {
        dispatch(
          setUserLogin({
            token: res.data.token,
            user: res.data.user,
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
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign-in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated');
      } else {
        console.error(error);
      }
    }
  };

  return (
    <Button
      mode="outlined"
      name="Sign in with Google"
      icon="google"
      onPress={onGoogleButtonPress}
      style={{marginBottom: 15}}
    />
  );
};

export default Google;
