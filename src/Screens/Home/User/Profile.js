import {View, Switch} from 'react-native';
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
  const onToggleIntern = async () => {
    const nextValue = !user?.is_intern;
    try {
      // Optimistically update the UI locally
      dispatch(setUser({ ...user, is_intern: nextValue }));
      
      // Update the database remotely by trying candidate endpoints
      const endpoints = [
        { method: 'PUT', url: '/user' },
        { method: 'POST', url: '/user/update' },
        { method: 'POST', url: '/user/updateProfile' },
        { method: 'POST', url: '/user/update_profile' },
        { method: 'PUT', url: '/user/update' },
        { method: 'PUT', url: '/user/updateProfile' },
        { method: 'POST', url: '/user/edit' },
        { method: 'POST', url: '/user/editProfile' },
        { method: 'POST', url: '/auth/updateProfile' },
        { method: 'POST', url: '/user' }
      ];
      
      let success = false;
      for (const ep of endpoints) {
        try {
          if (ep.method === 'PUT') {
            await useApi().put(ep.url, { is_intern: nextValue }, { skipErrorFlash: true, skipSuccessFlash: true });
          } else {
            await useApi().post(ep.url, { is_intern: nextValue }, { skipErrorFlash: true, skipSuccessFlash: true });
          }
          success = true;
          console.log(`Successfully updated intern status via ${ep.method} ${ep.url}`);
          break;
        } catch (err) {
          if (err.response?.status === 404 || err.response?.status === 405) {
            continue; // Try next endpoint
          }
          throw err; // Real error, propagate
        }
      }
      
      if (!success) {
        throw new Error('All candidate endpoints returned 404 or 405');
      }
    } catch (err) {
      console.log('Failed to update intern role in DB, reverting changes', err);
      // Revert the local changes on failure
      dispatch(setUser({ ...user, is_intern: !nextValue }));
    }
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
        <Avatar.Text 
          size={100} 
          label={(user?.fname?.[0] || '') + (user?.lname?.[0] || '')} 
          style={{backgroundColor: colors.primary}}
          color={colors.onPrimary}
        />
        <Text size="medium" style={{marginTop: 14, fontWeight: 'bold', color: colors.onSurface}}>
          {(user?.fname || '') + ' ' + (user?.lname || '')}
        </Text>
        <Text style={{color: colors.onSurfaceVariant, marginTop: 4}}>{user?.email}</Text>
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
          title="Intern Role"
          leftIcon="briefcase"
          rightIcon={
            <View pointerEvents="none">
              <Switch
                value={user?.is_intern || false}
                trackColor={{false: '#afafaf81'}}
              />
            </View>
          }
          onPress={onToggleIntern}
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
