import {View, Linking, Pressable, Keyboard} from 'react-native';
import {useState, useCallback} from 'react';
import {Button, TextInput, Text} from '../../Components/Input';
import {Screen} from '../../Components/Screen';
import useApi from '../../Components/Api/Api';
import {useMutation} from '@tanstack/react-query';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import DropDown from 'react-native-paper-dropdown';
import {useTheme} from 'react-native-paper';
import FlashMessage from '../../Components/Screen/FlashMessage';
const Sign_up = ({navigation}) => {
  const {colors} = useTheme();
  const [dropdown, setDropdown] = useState(false);
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    password: '',
    cpassword: '',
    dob: '',
    gender: '',
  });
  const [errors, setErrors] = useState({
    fname: false,
    lname: false,
    email: false,
    phone: false,
    password: false,
    cpassword: false,
    dob: false,
  });

  const showCalender = () => {
    DateTimePickerAndroid.open({
      value: new Date(),
      onChange: (e, date) => {
        Keyboard.dismiss();
        updateFormValue({name: 'dob', value: date.toLocaleDateString('en-GB')});
      },
    });
  };

  const updateFormValue = useCallback(({name, value}) => {
    setForm(prevForm => ({...prevForm, [name]: value}));
    setErrors(prevErrors => ({...prevErrors, [name]: false}));
  }, []);

  const {mutate, isPending} = useMutation({
    mutationFn: data => useApi().post('/auth/signup', data),
    onSuccess: res => {
      if (res.status === 200)
        navigation.replace('Otp', {email: form.email, type: 1});
    },
  });

  const isGreaterThan5Years = dobString => {
    const [day, month, year] = dobString.split('/').map(Number);
    const dob = new Date(year, month - 1, day); // month is 0-indexed
    return (new Date() - dob) / (1000 * 60 * 60 * 24 * 365.25) > 5;
  };

  const handleSubmit = async () => {
    const newErrors = {};
    Object.keys(form).forEach(key => {
      if (!form[key].trim()) {
        newErrors[key] = true;
      } else {
        newErrors[key] = false;
      }
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    newErrors.email = !emailRegex.test(form.email.trim());

    const phoneRegex = /^[0-9]{10}$/;
    newErrors.phone = !phoneRegex.test(form.phone.trim());
    newErrors.cpassword = form.password !== form.cpassword;
    newErrors.gender = false;
    setErrors(newErrors);

    if (!Object.values(newErrors).some(error => error)) {
      if (!isGreaterThan5Years(form.dob)) {
        return FlashMessage({
          message: 'Enter a valid date of birth',
          type: 'danger',
        });
      }
      if (form.gender === '') {
        return FlashMessage({
          message: 'Please select your gender',
          type: 'danger',
        });
      }
      if (form.password.length < 8) {
        return FlashMessage({
          message: 'Password must be at least 8 characters long',
          type: 'danger',
        });
      }
      mutate({
        ...form,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        fname: form.fname.trim(),
        lname: form.lname.trim(),
      });
    }
  };

  return (
    <Screen style={{justifyContent: 'space-between'}}>
      <View style={{alignItems: 'center', flex: 1, justifyContent: 'center'}}>
        <Text size="large">Create your account</Text>
      </View>

      <View>
        <View style={{flexDirection: 'row', gap: 15}}>
          <TextInput
            label="First Name"
            name="fname"
            updateFormValue={updateFormValue}
            style={{flex: 1}}
            error={errors.fname}
          />
          <TextInput
            label="Last Name"
            name="lname"
            updateFormValue={updateFormValue}
            style={{flex: 1}}
            error={errors.lname}
          />
        </View>
        <TextInput
          label="Email"
          name="email"
          updateFormValue={updateFormValue}
          keyboard="email-address"
          error={errors.email}
        />
        <TextInput
          label="Phone"
          name="phone"
          maxLength={10}
          updateFormValue={updateFormValue}
          keyboard="number-pad"
          error={errors.phone}
        />
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
        <TextInput
          label="Password"
          name="password"
          rightIcon={true}
          updateFormValue={updateFormValue}
          error={errors.password}
        />
        <TextInput
          label="Confirm Password"
          name="cpassword"
          rightIcon={true}
          updateFormValue={updateFormValue}
          error={errors.cpassword}
        />
        <View
          style={{
            marginVertical: 5,
            flexDirection: 'row',
            marginBottom: 15,
            gap: 4,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
          <Text size="">By signing up, you agree to our</Text>
          <Pressable
            onPress={() =>
              Linking.openURL('https://www.studifysuccess.com/terms-conditions')
            }>
            <Text size="" style={{color: '#0c4e4e'}}>
              Terms & Conditions
            </Text>
          </Pressable>
          <Text size="">and</Text>
          <Pressable
            onPress={() =>
              Linking.openURL('https://www.studifysuccess.com/privacy-policy')
            }>
            <Text size="" style={{color: '#0c4e4e', marginTop: -5}}>
              Privacy Policy
            </Text>
          </Pressable>
        </View>
        <Button name="Sign up" onPress={handleSubmit} loading={isPending} />
      </View>
    </Screen>
  );
};

export default Sign_up;
