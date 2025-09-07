import {Text, TextInput, Button} from '../../Components/Input';
import {useState} from 'react';
import {Screen} from '../../Components/Screen';
import {Image, View} from 'react-native';
import useApi from '../../Components/Api/Api';
const Wishlist = ({navigation}) => {
  const [room, setRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const updateFormValue = ({name, value}) => {
    setRoom(value);
  };
  // https://freeipapi.com/api/json/103.69.14.110
  const handleSubmit = async () => {
    if (!room) return;
    setLoading(true);
    try {
      const res = await useApi().post(
        'https://www.api.studifysuccess.com/lms/jitsi_token/room',
        {room},
      );
      if (res.status === 200) {
        navigation.navigate('Meet', {room});
      }
    } catch (e) {
      console.log('error', e);
    }
    setLoading(false);
  };

  return (
    <Screen NoHeader list>
      <Image
        source={require('../../Assets/Images/meet.png')}
        style={{
          width: 300,
          height: 300,
          marginTop: 100,
          alignSelf: 'center',
          objectFit: 'contain',
        }}
      />
      <View style={{flex: 0.6, justifyContent: 'center'}}>
        <TextInput
          label="Room Name"
          name="room"
          updateFormValue={updateFormValue}
        />
        <Button name="Join" onPress={handleSubmit} loading={loading} />
      </View>
    </Screen>
  );
};

export default Wishlist;
