import {Text, TextInput, Button} from '../../Components/Input';
import {useState} from 'react';
import {Screen} from '../../Components/Screen';
import {Image, View} from 'react-native';
const Wishlist = () => {
  const [room, setRoom] = useState('');
  const updateFormValue = ({name, value}) => {
    setRoom(value);
  };
  // https://freeipapi.com/api/json/103.69.14.110
  const handleSubmit = () => {};
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
        <Button name="Join" onPress={handleSubmit} />
      </View>
    </Screen>
  );
};

export default Wishlist;
