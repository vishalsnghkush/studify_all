import {View} from 'react-native';
import {useState, useEffect} from 'react';
import {Screen} from '../../../Components/Screen';
import {TextInput, Button} from '../../../Components/Input';
import useApi from '../../../Components/Api/Api';
import {ActivityIndicator} from 'react-native-paper';
import {useDispatch} from 'react-redux';
import {updateUserName} from '../../../Redux/Slices/InitialSlice';
import {useMutation} from '@tanstack/react-query';
const EditProfile = ({navigation}) => {
  const {get, put, post} = useApi();
  const [user, setUser] = useState();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    phone: '',
  });
  const [errors, setErrors] = useState({
    fname: false,
    lname: false,
    phone: false,
  });
  useEffect(() => {
    const getUser = async () => {
      const res = await get('/user');
      setUser(res.data);
      setForm({
        fname: res.data.fname || '',
        lname: res.data.lname || '',
        phone: res.data.phone || '',
      });
    };
    getUser();
  }, []);

  const updateFormValue = ({name, value}) => {
    setForm({...form, [name]: value});
    setErrors({...errors, [name]: false});
  };

  const {mutate, isPending} = useMutation({
    mutationFn: data => post('/user', data),
    onSuccess: res => {
      if (res.status === 200) {
        dispatch(updateUserName({fname: form.fname, lname: form.lname}));
      }
      navigation.goBack();
    },
  });

  const submit = async () => {
    const newErrors = {};
    Object.keys(form).forEach(key => {
      if (!form[key]) {
        newErrors[key] = true;
      } else {
        newErrors[key] = false;
      }
    });

    newErrors.fname = (form.fname || '').length < 3;
    newErrors.lname = (form.lname || '').length < 3;
    newErrors.phone = (form.phone || '').toString().length <= 9;
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
            <TextInput label="DOB" defaultValue={user?.dob} disabled />
            <TextInput label="Gender" defaultValue={user?.gender} disabled />
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
