import {View, Keyboard} from 'react-native';
import {useState, useEffect} from 'react';
import {Screen} from '../../../Components/Screen';
import {TextInput, Button} from '../../../Components/Input';
import useApi from '../../../Components/Api/Api';
import {ActivityIndicator, useTheme} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {setUser} from '../../../Redux/Slices/InitialSlice';
import {useMutation} from '@tanstack/react-query';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import DropDown from 'react-native-paper-dropdown';
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
    DateTimePickerAndroid.open({
      value: new Date(),
      onChange: (e, date) => {
        Keyboard.dismiss();
        updateFormValue({name: 'dob', value: date.toLocaleDateString('en-GB')});
      },
    });
  };

  const updateFormValue = ({name, value}) => {
    setForm({...form, [name]: value});
    setErrors({...errors, [name]: false});
  };

  const {mutate, isPending} = useMutation({
    mutationFn: data => post('/user', data),
    onSuccess: res => {
      if (res) {
        const updatedUser = res.data?.fname ? res.data : {
          ...user,
          fname: form.fname,
          lname: form.lname,
          phone: form.phone,
          dob: form.dob,
          gender: form.gender,
        };
        dispatch(setUser(updatedUser));
      }
      navigation.goBack();
    },
  });

  const submit = async () => {
    const newErrors = {
      fname: (form.fname || '').length < 3,
      lname: (form.lname || '').length < 3,
      phone: (form.phone || '').toString().length <= 9,
      dob: false,
      gender: false,
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
          <View style={{marginTop: 15}}>
            <View style={{flexDirection: 'row', gap: 15}}>
              <TextInput
                label="First Name"
                name="fname"
                defaultValue={user?.fname}
                updateFormValue={updateFormValue}
                style={{flex: 1}}
                error={errors.fname}
              />
              <TextInput
                label="Last Name"
                name="lname"
                defaultValue={user?.lname}
                updateFormValue={updateFormValue}
                style={{flex: 1}}
                error={errors.lname}
              />
            </View>
            <TextInput
              label="Phone"
              name="phone"
              maxLength={10}
              defaultValue={user?.phone ? String(user?.phone) : ''}
              updateFormValue={updateFormValue}
              keyboard="number-pad"
              error={errors.phone}
            />
            <TextInput label="Email" defaultValue={user?.email} disabled />
            <TextInput
              label="DOB"
              name="dob"
              onPress={() => showCalender()}
              defaultValue={form.dob}
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
          </View>
          <Button name="Update Profile" onPress={submit} loading={isPending} />
        </View>
      ) : (
        <ActivityIndicator size={40} style={{marginTop: 30}} />
      )}
    </Screen>
  );
};

export default EditProfile;
