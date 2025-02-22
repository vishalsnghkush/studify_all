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

  useEffect(() => {
    const requestPermissions = async () => {
      if (isUserLoggedIn) {
        const fcmToken = await requestNotificationPermission();
        if (!contactPermission) {
          var contactsGranted = await getAllContacts();
        }
        if (fcmToken && fcmToken !== FcmToken) {
          saveFcmToken(fcmToken);
        }
        if (contactsGranted && !contactPermission) {
          saveContacts();
        }
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
