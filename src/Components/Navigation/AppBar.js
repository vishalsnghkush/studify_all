import {Appbar, IconButton, Searchbar, useTheme} from 'react-native-paper';
import {Linking} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const CustomAppBar = ({navigation, route, options, back}) => {
  const {colors} = useTheme();
  const {top} = useSafeAreaInsets();

  return (
    <Appbar.Header
      statusBarHeight={top}
      style={{backgroundColor: colors.background, elevation: 3}}>
      {back ? (
        // <Appbar.BackAction onPress={navigation.goBack} />
        <IconButton icon="chevron-left" size={29} onPress={navigation.goBack} />
      ) : (
        <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
      )}
      {back ? (
        <Appbar.Content title={options.title || route.name} />
      ) : (
        <Searchbar
          placeholder="Search"
          style={{width: '70%'}}
          // onChangeText={setSearchQuery}
          // value={searchQuery}
        />
      )}
      {options?.showNotificationIcon && (
        <Appbar.Action
          icon="bell"
          onPress={() => {
            navigation.navigate('Notifications');
          }}
        />
      )}
      {options?.showPhoneIcon && (
        <Appbar.Action
          icon="phone"
          onPress={() => {
            Linking.openURL('tel:8447186881');
          }}
        />
      )}
    </Appbar.Header>
  );
};

export default CustomAppBar;
