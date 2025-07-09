import {Linking, View} from 'react-native';
import {Drawer, Avatar, TouchableRipple} from 'react-native-paper';
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
  const {user} = useSelector(state => state.initial);
  const {bottom} = useSafeAreaInsets();

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
                flexDirection: 'row',
                padding: 15,
                alignItems: 'center',
                gap: 10,
              }}>
              <Avatar.Text size={60} label={user.fname[0] + user.lname[0]} />
              <View>
                <Text size="medium">{user.fname}</Text>
                <Text size="small">{user.lname}</Text>
              </View>
            </View>
          </TouchableRipple>
          {/* <Drawer.Item
            label="Notes"
            icon="file-document"
            onPress={() => navigate('Notes')}
          /> */}
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
