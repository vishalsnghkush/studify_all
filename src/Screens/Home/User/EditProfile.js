import {View, Keyboard, Alert, ScrollView} from 'react-native';
import {useState, useEffect} from 'react';
import {Screen} from '../../../Components/Screen';
import {TextInput, Button} from '../../../Components/Input';
import useApi from '../../../Components/Api/Api';
import {ActivityIndicator, useTheme, Avatar} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {setUser} from '../../../Redux/Slices/InitialSlice';
import {useMutation} from '@tanstack/react-query';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import DropDown from 'react-native-paper-dropdown';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://www.api.studifysuccess.com/api';
const EditProfile = ({navigation}) => {
  const {colors} = useTheme();
  const {get, put, post} = useApi();
  const [user, setUserState] = useState();
  const {user: reduxUser} = useSelector(state => state.initial);
  const dispatch = useDispatch();
  const [dropdown, setDropdown] = useState(false);
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    phone: '',
    dob: '',
    gender: '',
  });
  const [errors, setErrors] = useState({
    fname: false,
    lname: false,
    phone: false,
    dob: false,
    gender: false,
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await get('/user');
        if (res && res.data) {
          setUserState(res.data);
          setForm({
            fname: res.data.fname || '',
            lname: res.data.lname || '',
            phone: res.data.phone || '',
            dob: res.data.dob || '',
            gender: res.data.gender || '',
          });
        } else {
          fallbackToRedux();
        }
      } catch (err) {
        fallbackToRedux();
      }
    };
    const fallbackToRedux = () => {
      if (reduxUser) {
        setUserState(reduxUser);
        setForm({
          fname: reduxUser.fname || '',
          lname: reduxUser.lname || '',
          phone: reduxUser.phone || '',
          dob: reduxUser.dob || '',
          gender: reduxUser.gender || '',
        });
      }
    };
    getUser();
  }, []);

  const showCalender = () => {
    let initialDate = new Date();
    if (form.dob) {
      const parts = form.dob.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed month
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          initialDate = new Date(year, month, day);
        }
      }
    } else {
      // Default to 18 years ago if no DOB has been entered yet
      initialDate.setFullYear(initialDate.getFullYear() - 18);
    }

    DateTimePickerAndroid.open({
      value: initialDate,
      onChange: (e, date) => {
        Keyboard.dismiss();
        if (e.type === 'set' && date) {
          updateFormValue({name: 'dob', value: date.toLocaleDateString('en-GB')});
        }
      },
    });
  };

  const updateFormValue = ({name, value}) => {
    setForm(prev => ({...prev, [name]: value}));
    setErrors(prev => ({...prev, [name]: false}));
  };

  const {mutate, isPending} = useMutation({
    mutationFn: async (data) => {
      const token = await AsyncStorage.getItem('studify_token');
      const headers = { Authorization: `Bearer ${token}` };
      const endpoints = [
        { method: 'POST', url: '/user/update' },
        { method: 'POST', url: '/user/updateProfile' },
        { method: 'POST', url: '/user/update_profile' },
        { method: 'PUT', url: '/user/update' },
        { method: 'PUT', url: '/user/updateProfile' },
        { method: 'POST', url: '/user/edit' },
        { method: 'POST', url: '/user/editProfile' },
        { method: 'POST', url: '/auth/update' },
        { method: 'POST', url: '/auth/updateProfile' },
        { method: 'POST', url: '/user' },
        { method: 'PUT', url: '/user' }
      ];
      
      for (const ep of endpoints) {
        try {
          let reqData = data;
          let reqHeaders = { ...headers };
          if (ep.method === 'PUT') {
            reqData = { ...reqData, _method: 'PUT' };
            reqHeaders['X-HTTP-Method-Override'] = 'PUT';
            ep.method = 'POST'; // Laravel spoofing
          }
          const res = await axios({
            method: ep.method,
            url: BASE_URL + ep.url,
            data: reqData,
            headers: reqHeaders
          });
          return res.data;
        } catch (err) {
          if (err.response?.status === 404) {
            continue; // Route not found, try next
          }
          if (err.response?.status === 405) {
            continue; // Method not allowed, try next
          }
          // If it's a validation error or success or 401, return it to show the real error
          throw err;
        }
      }
      // If all fail, throw error so UI knows
      throw new Error("No valid endpoint found. All returned 404.");
    },
    onSuccess: res => {
      // Since any API failure throws an error, onSuccess only triggers on HTTP success
      const userData = res?.data || res;
      const updatedUser = userData?.fname ? userData : {
        ...reduxUser,
        fname: form.fname,
        lname: form.lname,
        phone: form.phone,
        dob: form.dob,
        gender: form.gender,
      };
      dispatch(setUser(updatedUser));
      Alert.alert('Success', 'Profile updated successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()}
      ]);
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Update failed');
    }
  });

  const submit = async () => {
    const newErrors = {
      fname: (form.fname || '').length < 3,
      lname: (form.lname || '').length < 3,
      phone: (form.phone || '').toString().length <= 9,
      dob: !form.dob,
      gender: !form.gender,
    };
    setErrors(newErrors);

    if (!Object.values(newErrors).some(error => error)) {
      try {
        mutate(form);
      } catch (error) {}
    }
  };

  return (
    <Screen>
      {user ? (
        <View style={{flex: 1, justifyContent: 'space-between'}}>
          <ScrollView contentContainerStyle={{flexGrow: 1}} showsVerticalScrollIndicator={false}>
            <View style={{alignItems: 'center', marginTop: 15, marginBottom: 25}}>
              <Avatar.Text 
                size={90} 
                label={(form.fname?.[0] || 'U').toUpperCase() + (form.lname?.[0] || '').toUpperCase()} 
                style={{backgroundColor: colors.primary, elevation: 4}} 
              />
            </View>
            <View style={{flexDirection: 'row', gap: 15}}>
              <TextInput
                label="First Name"
                name="fname"
                value={form.fname}
                updateFormValue={updateFormValue}
                style={{flex: 1}}
                error={errors.fname}
              />
              <TextInput
                label="Last Name"
                name="lname"
                value={form.lname}
                updateFormValue={updateFormValue}
                style={{flex: 1}}
                error={errors.lname}
              />
            </View>
            <TextInput
              label="Phone"
              name="phone"
              maxLength={10}
              value={form.phone ? String(form.phone) : ''}
              updateFormValue={updateFormValue}
              keyboard="number-pad"
              error={errors.phone}
            />
            <TextInput label="Email" defaultValue={user?.email} disabled />
            <TextInput
              label="DOB"
              name="dob"
              onPress={() => showCalender()}
              value={form.dob}
              error={errors.dob}
            />
            <View style={{marginBottom: 15}}>
              <DropDown
                label="Gender"
                mode="outlined"
                visible={dropdown}
                showDropDown={() => setDropdown(true)}
                onDismiss={() => setDropdown(false)}
                value={form.gender}
                setValue={value => {
                  updateFormValue({name: 'gender', value});
                  setDropdown(false);
                }}
                list={[
                  {label: 'Male', value: 'Male'},
                  {label: 'Female', value: 'Female'},
                  {label: 'Other', value: 'Other'},
                ]}
                dropDownItemTextStyle={{color: colors.onBackground}}
                error={errors.gender}
              />
            </View>
          </ScrollView>
          <Button name="Update Profile" onPress={submit} loading={isPending} />
        </View>
      ) : (
        <ActivityIndicator size={40} style={{marginTop: 30}} />
      )}
    </Screen>
  );
};

export default EditProfile;
