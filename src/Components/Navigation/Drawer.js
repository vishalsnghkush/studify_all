import {Linking, View, Image} from 'react-native';
import {Drawer, Avatar, TouchableRipple, useTheme} from 'react-native-paper';
import {DrawerContentScrollView} from '@react-navigation/drawer';
import {Text} from '../Input';
import {useSelector} from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const DrawerComponent = props => {
  const navigate = nav => {
    props.navigation.navigate(nav);
    props.navigation.closeDrawer();
  };
  const navigateWithParams = (nav, params) => {
    props.navigation.navigate(nav, params);
    props.navigation.closeDrawer();
  };

  const {user} = useSelector(state => state.initial);
  const {bottom} = useSafeAreaInsets();
  const {colors} = useTheme();

  return (
    <View style={{flex: 1}}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          flex: 1,
          justifyContent: 'space-between',
          paddingBottom: bottom || 0,
        }}>
        <View>
          <TouchableRipple onPress={() => navigate('Profile')}>
            <View
              style={{
                backgroundColor: colors.primary,
                padding: 20,
                paddingTop: 24,
                paddingBottom: 24,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                elevation: 4,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 4,
                shadowOffset: {width: 0, height: 2},
                marginBottom: 10,
              }}>
              {user?.avatar ? (
                <Image source={{uri: user.avatar}} style={{width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#fff'}} />
              ) : (
                <Avatar.Text
                  size={60}
                  label={(user.fname?.[0] || 'U') + (user.lname?.[0] || '')}
                  style={{backgroundColor: 'rgba(255, 255, 255, 0.25)', borderWidth: 2, borderColor: '#fff'}}
                  color="#fff"
                />
              )}
              <View style={{flex: 1}}>
                <Text size="medium" style={{color: '#fff', fontWeight: 'bold'}}>{user.fname} {user.lname}</Text>
                {user?.class && (
                  <Text size="small" style={{color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'bold', marginTop: 2}}>
                    Class: {user.class}
                  </Text>
                )}
              </View>
            </View>
          </TouchableRipple>
          <Drawer.Item
            label="AI Test Generator"
            icon="brain"
            onPress={() => navigate('TestGenerator')}
          />
          <Drawer.Item
            label="Online Quiz"
            icon="chat-question"
            onPress={() => navigate('OnlineQuiz')}
          />
          <Drawer.Item
            label="Activities"
            icon="layers"
            onPress={() => navigate('Activities')}
          />
          <Drawer.Item
            label="Counseling System"
            icon="account-group"
            onPress={() => navigate('Counselling')}
          />
          <Drawer.Item
            label="Support Portal"
            icon="help-circle"
            onPress={() =>
              navigateWithParams('WebView', {
                url: 'https://support.studifysuccess.com/',
                title: 'Support Portal',
              })
            }
          />
          <Drawer.Item
            label="Report Issue or Bug"
            icon="bug"
            onPress={() => navigate('Appreport')}
          />
        </View>

        <TouchableRipple
          style={{alignItems: 'center', padding: 5}}
          onPress={() =>
            Linking.openURL('https://www.linkedin.com/in/ankit-budhori/')
          }>
          <>
            <Text>App Version : {DeviceInfo.getVersion()}</Text>
            <Text>Crafted with 💚 in India</Text>
          </>
        </TouchableRipple>
      </DrawerContentScrollView>
    </View>
  );
};

export default DrawerComponent;
