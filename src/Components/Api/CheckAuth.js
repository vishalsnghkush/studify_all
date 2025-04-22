import axios from 'axios';
import {useDispatch, useSelector} from 'react-redux';
import {setPermission, setUserLogout} from '../../Redux/Slices/InitialSlice';
import {requestNotificationPermission} from '../../Utils/Notification';
import {getAllContacts} from '../../Utils/Contacts.';
import Contacts from 'react-native-contacts';
const BASE_URL = 'https://ss-backend-xi.vercel.app/api/';
// const BASE_URL = 'http://192.168.1.3:3000/api/';
import useApi from './Api';
import {useEffect} from 'react';
import {Alert} from 'react-native';
export default function CheckAuth() {
  const dispatch = useDispatch();
  const {user, token, FcmToken, contactPermission, isUserLoggedIn} =
    useSelector(state => state.initial);
  axios.defaults.headers.common['x-auth-token'] = token;
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  axios.defaults.baseURL = BASE_URL;
  console.log('auth rerender token', axios.defaults.baseURL);
  axios.interceptors.response.use(
    res => res,
    err => {
      if (err.response.status === 401) {
        dispatch(setUserLogout());
        console.log('invalid token');
      }
      return Promise.reject(err);
    },
  );

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
      userId: user.id || 1,
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
}
