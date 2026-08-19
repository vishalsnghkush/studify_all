import {View, Keyboard, Alert, ScrollView, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {useState, useEffect} from 'react';
import {Screen} from '../../../Components/Screen';
import {TextInput, Button} from '../../../Components/Input';
import useApi from '../../../Components/Api/Api';
import {ActivityIndicator, Text, useTheme} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {setUser} from '../../../Redux/Slices/InitialSlice';
import {useMutation} from '@tanstack/react-query';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import DropDown from 'react-native-paper-dropdown';
import {launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BASE_URL = 'https://www.api.studifysuccess.com/api';

const EditProfile = ({navigation}) => {
  const {colors} = useTheme();
  const {get, put, post} = useApi();
  const [user, setUserState] = useState();
  const {user: reduxUser} = useSelector(state => state.initial);
  const dispatch = useDispatch();
  const [dropdown, setDropdown] = useState(false);
  const [classDropdown, setClassDropdown] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null); // local preview
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    phone: '',
    dob: '',
    gender: '',
    class: '',
  });
  const [errors, setErrors] = useState({
    fname: false,
    lname: false,
    phone: false,
    dob: false,
    gender: false,
    class: false,
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
            class: res.data.class || '',
          });
          if (res.data.avatar) {
            setAvatarUri(res.data.avatar);
          }
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
          class: reduxUser.class || '',
        });
        if (reduxUser.avatar) {
          setAvatarUri(reduxUser.avatar);
        }
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
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          initialDate = new Date(year, month, day);
        }
      }
    } else {
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

  const pickAvatar = () => {
    launchImageLibrary(
      {mediaType: 'photo', includeBase64: true, quality: 0.5, maxWidth: 400, maxHeight: 400},
      async response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset?.base64) return;

        const base64Data = `data:${asset.type};base64,${asset.base64}`;
        setAvatarUri(base64Data); // show preview immediately

        setIsUploadingAvatar(true);
        try {
          // useApi reads token from Redux + uses correct baseURL path
          await post('/user/avatar', {avatar: base64Data});
          dispatch(setUser({...reduxUser, avatar: base64Data}));
          Alert.alert('✅ Avatar Updated', 'Your profile photo has been saved!');
        } catch (err) {
          console.log('Avatar upload error:', err?.response?.status, err?.response?.data);
          if (err?.response?.status !== 401) {
            Alert.alert('Error', 'Failed to upload avatar. Please try again.');
          }
          setAvatarUri(reduxUser?.avatar || null);
        } finally {
          setIsUploadingAvatar(false);
        }
      },
    );
  };

  const {mutate, isPending} = useMutation({
    mutationFn: async data => {
      // useApi reads token from Redux + uses correct baseURL path
      const res = await put('/user/update', data);
      return res;
    },
    onSuccess: res => {
      const updatedUser = {
        ...reduxUser,
        fname: form.fname,
        lname: form.lname,
        phone: form.phone,
        dob: form.dob,
        gender: form.gender,
        class: form.class,
      };
      dispatch(setUser(updatedUser));
      Alert.alert('Success', 'Profile updated successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    },
    onError: err => {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Update failed');
    },
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
      mutate(form);
    }
  };

  const initials =
    ((form.fname?.[0] || 'U').toUpperCase() + (form.lname?.[0] || '').toUpperCase());

  return (
    <Screen>
      {user ? (
        <View style={{flex: 1, justifyContent: 'space-between'}}>
          <ScrollView contentContainerStyle={{flexGrow: 1, paddingBottom: 20}} showsVerticalScrollIndicator={false}>

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={pickAvatar}
                disabled={isUploadingAvatar}
                style={styles.avatarWrapper}>
                {avatarUri ? (
                  <Image source={{uri: avatarUri}} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, {backgroundColor: colors.primary}]}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
                {/* Edit Badge */}
                <View style={[styles.editBadge, {backgroundColor: colors.primary}]}>
                  {isUploadingAvatar ? (
                    <ActivityIndicator size={12} color="#fff" />
                  ) : (
                    <Icon name="camera" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={[styles.changePhotoText, {color: colors.primary}]}>
                {isUploadingAvatar ? 'Uploading...' : 'Tap to change photo'}
              </Text>
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
            {!reduxUser?.is_intern && !reduxUser?.is_tl && (
              <View style={{marginBottom: 15}}>
                <DropDown
                  label="Class/Standard"
                  mode="outlined"
                  visible={classDropdown}
                  showDropDown={() => setClassDropdown(true)}
                  onDismiss={() => setClassDropdown(false)}
                  value={form.class}
                  setValue={value => {
                    updateFormValue({name: 'class', value});
                    setClassDropdown(false);
                  }}
                  list={[
                    {label: 'Class 1st', value: 'Class 1st'},
                    {label: 'Class 2nd', value: 'Class 2nd'},
                    {label: 'Class 3rd', value: 'Class 3rd'},
                    {label: 'Class 4th', value: 'Class 4th'},
                    {label: 'Class 5th', value: 'Class 5th'},
                    {label: 'Class 6th', value: 'Class 6th'},
                    {label: 'Class 7th', value: 'Class 7th'},
                    {label: 'Class 8th', value: 'Class 8th'},
                    {label: 'Class 9th', value: 'Class 9th'},
                    {label: 'Class 10th', value: 'Class 10th'},
                    {label: 'Class 11th', value: 'Class 11th'},
                    {label: 'Class 12th', value: 'Class 12th'},
                  ]}
                  dropDownItemTextStyle={{color: colors.onBackground}}
                  error={errors.class}
                />
              </View>
            )}
          </ScrollView>
          <Button name="Update Profile" onPress={submit} loading={isPending} />
        </View>
      ) : (
        <ActivityIndicator size={40} style={{marginTop: 30}} />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 28,
  },
  avatarWrapper: {
    width: 105,
    height: 105,
    borderRadius: 52.5,
    position: 'relative',
  },
  avatarImage: {
    width: 105,
    height: 105,
    borderRadius: 52.5,
  },
  avatarPlaceholder: {
    width: 105,
    height: 105,
    borderRadius: 52.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  avatarInitials: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default EditProfile;
