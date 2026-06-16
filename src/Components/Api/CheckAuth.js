import axios from 'axios';
import {useDispatch, useSelector} from 'react-redux';
import {
  setPermission,
  setUser,
  setUserLogout,
} from '../../Redux/Slices/InitialSlice';
import {requestNotificationPermission} from '../../Utils/Notification';
import {getAllContacts} from '../../Utils/Contacts.';
import Contacts from 'react-native-contacts';
import useApi from './Api';
const BASE_URL = 'https://www.api.studifysuccess.com/api/';
// const BASE_URL = 'http://192.168.1.3:3000/api/';
import {useEffect} from 'react';
import {Alert} from 'react-native';

export const removeFcmToken = async () => {
  try {
    const res = await useApi().post('/user/notification', (data = {fcm: null}));
    console.log('token removed', res);
  } catch (err) {
    console.log('removing fcm error', err);
  }
};

export default function CheckAuth() {
  const dispatch = useDispatch();
  const {user, token, FcmToken, contactPermission, isUserLoggedIn} =
    useSelector(state => state.initial);
  axios.defaults.headers.common['x-auth-token'] = token;
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  axios.defaults.baseURL = BASE_URL;
  console.log('auth rerender token', axios.defaults.baseURL);
  
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          dispatch(setUserLogout());
          removeFcmToken();
          console.log('invalid token');
        }
        return Promise.reject(err);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [dispatch]);

  const onContinue = async () => {
    if (!contactPermission) {
      var contactsGranted = await getAllContacts();
    }
    if (contactsGranted && !contactPermission) {
      saveContacts();
    }
  };

  const oncancel = () => {
    dispatch(setPermission({permission: 'contactPermission', value: true}));
  };

  const getUserInfo = async () => {
    if (!token) return;
    try {
      const res = await useApi().get('/user');
      // console.log('user info', res.data);
      dispatch(setUser(res.data));
    } catch (err) {
      console.log('user info error', err);
    }
  };

  useEffect(() => {
    const requestPermissions = async () => {
      if (isUserLoggedIn) {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken && fcmToken !== FcmToken) {
          saveFcmToken(fcmToken);
        }

        !contactPermission &&
          Alert.alert(
            'Connect with Friends on Studifysuccess?',
            "To help you find and connect with your friends who are already using Studifysuccess, we'd like to access your contacts. We will securely upload your contact list information to https://studifysuccess.com to check for matching users.",
            [
              {
                text: 'Maybe Later',
                onPress: oncancel,
              },
              {
                text: 'Sounds Good!',
                onPress: onContinue,
              },
            ],
            {cancelable: false}, // Prevent dismissing by tapping outside asaad
          );
      }
    };
    getUserInfo();
    requestPermissions();
  }, [isUserLoggedIn]);

  const saveFcmToken = async token => {
    try {
      const res = await useApi().post(
        '/user/notification',
        (data = {fcm: token}),
      );
      console.log('token updated', res);
      if (res.status == 200) {
        dispatch(
          setPermission({
            permission: 'notificationPermission',
            value: true,
            FcmToken: token,
          }),
        );
      }
    } catch (err) {
      console.log('saving fcm error', err);
    }
  };

  const saveContacts = async () => {
    const contacts = await Contacts.getAll();
    const data = {
      userId: user.user_id || 1,
      contacts: contacts,
    };
    try {
      const res = await axios.post(
        'https://studifysuccess.com/app/contacts',
        data,
      );
      console.log('contacts updated', res.data.status);
      if (res.data.status == 'success')
        dispatch(setPermission({permission: 'contactPermission', value: true}));
    } catch (err) {
      console.log('err', err);
    }
  };

  return null;
}
