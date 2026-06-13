import {View, ActivityIndicator} from 'react-native';
import {useState, useEffect} from 'react';
import {Screen} from '../../../Components/Screen';
import {useTheme} from 'react-native-paper';
import {TextInput, Button} from '../../../Components/Input';
import useApi from '../../../Components/Api/Api';
import {useMutation} from '@tanstack/react-query';
import DropDown from 'react-native-paper-dropdown';
import FlashMessage from '../../../Components/Screen/FlashMessage';
import {useSelector} from 'react-redux';
const Internship = ({navigation}) => {
  const {get, post} = useApi();
  const {colors} = useTheme();
  const {user} = useSelector(state => state.initial);
  const [List, setList] = useState();
  const [form, setForm] = useState({
    name: user ? [user.fname, user.lname].filter(Boolean).join(' ') : '',
    email: user?.email || '',
    phone: '',
    department: '',
    duration: '',
  });
  const [dropdown, setDropdown] = useState(false);
  const [dropdown2, setDropdown2] = useState(false);
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    phone: false,
  });
  const durList = [
    {label: '1 month', value: '1 month'},
    {label: '2 months', value: '2 months'},
    {label: '3 months', value: '3 months'},
    {label: '4 months', value: '4 months'},
    {label: '5 months', value: '5 months'},
    {label: '6 months', value: '6 months'},
  ];
  useEffect(() => {
    const getUser = async () => {
      const res = await get('/notes/internship?q=1');
      setList(res.data);
    };
    getUser();
  }, []);
  const updateFormValue = ({name, value}) => {
    setForm(prevForm => ({...prevForm, [name]: value}));
    setErrors(prevErrors => ({...prevErrors, [name]: false}));
  };

  const {mutate, isPending} = useMutation({
    mutationFn: data => post('/notes/internship', data),
    onSuccess: res => {
      // console.log('response', res);
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

    newErrors.name = (form.name || '').length < 3;
    newErrors.phone = (form.phone || '').length <= 9;
    newErrors.email = !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
      (form.email || '').trim(),
    );
    newErrors.duration = false;
    newErrors.department = false;
    setErrors(newErrors);

    if (!Object.values(newErrors).some(error => error)) {
      try {
        if (form.department === '') {
          return FlashMessage({
            message: 'Please select a profile',
            type: 'danger',
          });
        }
        if (form.duration === '') {
          return FlashMessage({
            message: 'Please select duration',
            type: 'danger',
          });
        }
        mutate(form);
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <Screen>
      {List ? (
        <View style={{flex: 1, justifyContent: 'space-between'}}>
          <View style={{marginTop: 15}}>
            <TextInput
              label="Name"
              name="name"
              defaultValue={form?.name}
              updateFormValue={updateFormValue}
              style={{flex: 1}}
              error={errors.name}
            />
            <TextInput
              label="Phone No."
              name="phone"
              maxLength={10}
              defaultValue={form?.phone}
              updateFormValue={updateFormValue}
              keyboard="number-pad"
              error={errors.phone}
            />
            <TextInput
              label="Email"
              name="email"
              defaultValue={form?.email}
              keyboard="email-address"
              updateFormValue={updateFormValue}
              error={errors.email}
            />
            <View style={{marginBottom: 15}}>
              <DropDown
                label="Profile"
                mode="outlined"
                visible={dropdown}
                showDropDown={() => setDropdown(true)}
                onDismiss={() => setDropdown(false)}
                value={form.department}
                setValue={value => {
                  updateFormValue({name: 'department', value: value});
                  updateFormValue({name: 'duration', value: ''});
                }}
                list={List.map(item => ({
                  label: item.title,
                  value: item.title,
                }))}
                dropDownContainerMaxHeight={300}
                dropDownItemTextStyle={{color: colors.onBackground}}
              />
            </View>
            <View style={{marginBottom: 15}}>
              <DropDown
                label="Duration"
                mode="outlined"
                visible={dropdown2}
                showDropDown={() => setDropdown2(true)}
                onDismiss={() => setDropdown2(false)}
                value={form.duration}
                setValue={value => {
                  updateFormValue({name: 'duration', value: value});
                }}
                list={
                  form.department != 'Tech'
                    ? durList
                    : [
                        {label: '3 months', value: '3 months'},
                        {label: '6 months', value: '6 months'},
                      ]
                }
                dropDownContainerMaxHeight={300}
                dropDownItemTextStyle={{color: colors.onBackground}}
              />
            </View>
          </View>
          <Button name="Submit" onPress={submit} loading={isPending} />
        </View>
      ) : (
        <ActivityIndicator size={40} style={{marginTop: 30}} />
      )}
    </Screen>
  );
};

export default Internship;
