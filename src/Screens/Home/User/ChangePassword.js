import {Screen} from '../../../Components/Screen';
import {Button, TextInput} from '../../../Components/Input';
import {useState} from 'react';
import {View} from 'react-native';
import useApi from '../../../Components/Api/Api';
import {useMutation} from '@tanstack/react-query';
import FlashMessage from '../../../Components/Screen/FlashMessage';
const ChangePassword = ({navigation}) => {
  const [form, setForm] = useState({
    oldpassword: '',
    newpassword: '',
    confirmpassword: '',
  });
  const [errors, setErrors] = useState({
    oldpassword: false,
    newpassword: false,
    confirmpassword: false,
  });
  const updateFormValue = ({name, value}) => {
    setForm({...form, [name]: value});
    setErrors({...errors, [name]: false});
  };

  const {mutate, isPending} = useMutation({
    mutationFn: data =>
      useApi().post(
        '/user/changepassword',
        (data = {
          password: form.oldpassword,
          cpassword: form.newpassword,
        }),
      ),
    onSuccess: res => {
      if (res) navigation.goBack();
    },
  });

  const handleSubmit = async () => {
    const newErrors = {};
    Object.keys(form).forEach(key => {
      if (!form[key].trim() && key !== 'oldpassword') {
        newErrors[key] = true;
      } else {
        newErrors[key] = false;
      }
    });
    newErrors.confirmpassword = form.newpassword !== form.confirmpassword;
    setErrors(newErrors);

    if (!Object.values(newErrors).some(error => error)) {
      if (form.newpassword.length < 8) {
        return FlashMessage({
          message: 'New Password must be at least 8 characters long',
          type: 'danger',
        });
      }
      mutate();
    }
  };

  return (
    <Screen>
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
        }}>
        <View>
          <TextInput
            label="Current Password (Leave blank if Google login)"
            name="oldpassword"
            updateFormValue={updateFormValue}
            rightIcon={true}
            error={errors.oldpassword}
          />
          <TextInput
            label="New Password"
            name="newpassword"
            updateFormValue={updateFormValue}
            rightIcon={true}
            error={errors.newpassword}
          />
          <TextInput
            label="Confirm New Password"
            name="confirmpassword"
            updateFormValue={updateFormValue}
            rightIcon={true}
            error={errors.confirmpassword}
          />
        </View>
        <Button name="Submit" onPress={handleSubmit} loading={isPending} />
      </View>
    </Screen>
  );
};

export default ChangePassword;
