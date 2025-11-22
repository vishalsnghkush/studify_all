import {View, Switch} from 'react-native';
import {useState} from 'react';
import {Text} from '../../../Components/Input';
import {Screen, CardHorizontal} from '../../../Components/Screen';
import {Avatar} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {setUserLogout, setTheme} from '../../../Redux/Slices/InitialSlice';
import {openModal} from '../../../Redux/Slices/ModalSlice';
import InAppReview from '../../../Components/Screen/InAppReview';
import {removeFcmToken} from '../../../Components/Api/CheckAuth';

const Profile = ({navigation}) => {
  const dispatch = useDispatch();
  const {isDark, user} = useSelector(state => state.initial);
  const [isSwitchOn, setIsSwitchOn] = useState(isDark);
  const onToggleSwitch = () => {
    dispatch(setTheme());
    setIsSwitchOn(!isSwitchOn);
  };
  return (
    <Screen NoHeader style={{justifyContent: 'center'}}>
      <InAppReview />
      <View style={{alignItems: 'center'}}>
        <Avatar.Text size={100} label={user?.fname[0] + user?.lname[0]} />
        <Text size="medium" style={{marginTop: 10, fontWeight: 'bold'}}>
          {user?.fname + ' ' + user?.lname}
        </Text>
        <Text>{user?.email}</Text>
      </View>
      <View style={{marginTop: 10}}>
        <CardHorizontal
          title="Edit Profile"
          leftIcon="account"
          onPress={() => {
            navigation.navigate('EditProfile');
          }}
        />
        <CardHorizontal
          title="Change Password"
          leftIcon="shield-account"
          onPress={() => {
            navigation.navigate('ChangePassword');
          }}
        />
        {/* <CardHorizontal
          title="Transactions"
          leftIcon="credit-card"
          onPress={() => {
            // navigation.navigate('Transaction');
            navigation.navigate('CustomerService');
          }}
        /> */}
        <CardHorizontal
          title="Dark Mode"
          leftIcon="weather-night"
          rightIcon={
            <Switch
              value={isSwitchOn}
              onValueChange={onToggleSwitch}
              trackColor={{false: '#afafaf81'}}
            />
          }
          onPress={onToggleSwitch}
        />
        <CardHorizontal
          title="Terms & Conditions"
          leftIcon="shield-alert"
          onPress={() => {
            navigation.navigate('WebView', {
              url: 'https://studifysuccess.com/terms-conditions',
            });
          }}
        />
        <CardHorizontal
          title="Privacy Policy"
          leftIcon="clipboard-text"
          onPress={() => {
            navigation.navigate('WebView', {
              url: 'https://studifysuccess.com/privacy-policy',
            });
          }}
        />
        <CardHorizontal
          title="Help Center"
          leftIcon="help-circle"
          onPress={() => {
            navigation.navigate('HelpCenter');
          }}
        />
        <CardHorizontal
          title="Logout"
          leftIcon="logout"
          onPress={() => {
            dispatch(
              openModal({
                title: 'Logout',
                content: 'Are you sure you want to logout?',
                button: {
                  title: 'Logout',
                  onPress: () => {
                    dispatch(setUserLogout());
                    removeFcmToken();
                  },
                },
              }),
            );
          }}
        />
      </View>
    </Screen>
  );
};

export default Profile;
