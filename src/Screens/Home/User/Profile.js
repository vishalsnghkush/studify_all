import {View, Switch, Image} from 'react-native';
import {useState} from 'react';
import {Text} from '../../../Components/Input';
import {Screen, CardHorizontal} from '../../../Components/Screen';
import {Avatar, useTheme} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {setUserLogout, setTheme, setUser} from '../../../Redux/Slices/InitialSlice';
import {openModal} from '../../../Redux/Slices/ModalSlice';
import InAppReview from '../../../Components/Screen/InAppReview';
import {removeFcmToken} from '../../../Components/Api/CheckAuth';
import useApi from '../../../Components/Api/Api';

const Profile = ({navigation}) => {
  const dispatch = useDispatch();
  const {colors} = useTheme();
  const {isDark, user} = useSelector(state => state.initial);
  const [isSwitchOn, setIsSwitchOn] = useState(isDark);
  const onToggleSwitch = () => {
    dispatch(setTheme());
    setIsSwitchOn(!isSwitchOn);
  };

  return (
    <Screen NoHeader style={{justifyContent: 'center'}}>
      <InAppReview />
      <View 
        style={{
          alignItems: 'center', 
          backgroundColor: isDark ? colors.elevation.level1 : 'rgba(216, 27, 96, 0.04)',
          margin: 16,
          padding: 24,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: isDark ? colors.outlineVariant : 'rgba(216, 27, 96, 0.1)',
        }}
      >
        {user?.avatar ? (
          <Image
            source={{uri: user.avatar}}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 3,
              borderColor: colors.primary,
            }}
          />
        ) : (
          <Avatar.Text
            size={100}
            label={(user?.fname?.[0] || '') + (user?.lname?.[0] || '')}
            style={{backgroundColor: colors.primary}}
            color={colors.onPrimary}
          />
        )}
        <Text size="medium" style={{marginTop: 14, fontWeight: 'bold', color: colors.onSurface}}>
          {(user?.fname || '') + ' ' + (user?.lname || '')}
        </Text>
        <Text style={{color: colors.onSurfaceVariant, marginTop: 4}}>{user?.email}</Text>
        {user?.class && !user?.is_intern && (
          <Text style={{color: colors.primary, marginTop: 4, fontWeight: 'bold'}}>
            Class: {user.class}
          </Text>
        )}
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
            <View pointerEvents="none">
              <Switch
                value={isSwitchOn}
                trackColor={{false: '#afafaf81'}}
              />
            </View>
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
