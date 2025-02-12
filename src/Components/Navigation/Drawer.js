import {View} from 'react-native';
import {Drawer, Avatar, TouchableRipple} from 'react-native-paper';
import {DrawerContentScrollView} from '@react-navigation/drawer';
import {Text} from '../Input';
import {useSelector} from 'react-redux';
import DeviceInfo from 'react-native-device-info';
const DrawerComponent = props => {
  const navigate = nav => {
    props.navigation.navigate(nav);
    props.navigation.closeDrawer();
  };
  const {user} = useSelector(state => state.initial);
  return (
    <View style={{flex: 1}}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{flex: 1, justifyContent: 'space-between'}}>
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

        <View style={{alignItems: 'center', padding: 5}}>
          <Text>App Version : {DeviceInfo.getVersion()}</Text>
          <Text>Crafted with ❤️ in India</Text>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

export default DrawerComponent;
