import {View, Image, Pressable} from 'react-native';
import {useState, useCallback} from 'react';
import {Text, Button, TextInput} from '../../Components/Input';
import {Screen} from '../../Components/Screen';
import {useDispatch} from 'react-redux';
import {setUserLogin} from '../../Redux/Slices/InitialSlice';
import useApi from '../../Components/Api/Api';
import {useMutation} from '@tanstack/react-query';
import Google from './Google';
const Sign_in = ({navigation}) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: false,
    password: false,
  });
  const updateFormValue = useCallback(
    ({name, value}) => {
      setForm({...form, [name]: value});
      setErrors({...errors, [name]: false});
    },
    [form, errors],
  );

  const {mutate, isPending} = useMutation({
    mutationFn: data => useApi().post('/auth', data),
    onSuccess: res => {
      if (res.message) navigation.navigate('Otp', {email: form.email, type: 1});
      dispatch(
        setUserLogin({
          token: res.data.token,
          user: res.data.user,
        }),
      );
    },
  });
  const handleSubmit = useCallback(async () => {
    const newErrors = {};
    Object.keys(form).forEach(key => {
      if (!form[key].trim()) {
        newErrors[key] = true;
      } else {
        newErrors[key] = false;
      }
    });

    // Check for valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    newErrors.email = !emailRegex.test(form.email.trim());

    // Check if passwords match
    // newErrors.password = form.password.length < 5;

    // Set errors state
    setErrors(newErrors);

    // If there are no errors, proceed with form submission
    if (!Object.values(newErrors).some(error => error)) {
      try {
        mutate(form);
      } catch (error) {
        // console.log('api error', error);
      }
    }
  }, [form]);

  return (
    <Screen style={{justifyContent: 'space-between'}}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Image
          source={require('../../Assets/Images/signin.png')}
          style={{
            width: 300,
            height: 250,
            objectFit: 'contain',
          }}
        />

        <Text size="large" style={{marginBottom: 10}}>
          Signin to your account
        </Text>
      </View>
      <Google />
      <View style={{marginBottom: 20, marginTop: 15}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View style={{flex: 1, height: 1, backgroundColor: '#a4a4a4'}} />
          <View>
            <Text style={{width: 50, textAlign: 'center', color: '#858585'}}>
              OR
            </Text>
          </View>
          <View style={{flex: 1, height: 1, backgroundColor: '#a4a4a4'}} />
        </View>
      </View>
      <View>
        <TextInput
          label="Email"
          name="email"
          keyboard="email-address"
          updateFormValue={updateFormValue}
          error={errors.email}
        />
        <TextInput
          label="Password"
          name="password"
          updateFormValue={updateFormValue}
          rightIcon={true}
          error={errors.password}
        />
        <View style={{marginBottom: 30}}>
          <Pressable
            onPress={() => {
              navigation.navigate('ForgetPassword');
            }}>
            <Text>Forget Password?</Text>
          </Pressable>
        </View>
        <View style={{marginBottom: 20, alignSelf: 'center'}}>
          <Pressable
            onPress={() => {
              navigation.navigate('Signup');
            }}>
            <Text>Don't have an account? Sign up</Text>
          </Pressable>
        </View>
        <Button name="Sign in" onPress={handleSubmit} loading={isPending} />
      </View>
    </Screen>
  );
};

export default Sign_in;
