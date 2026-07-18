import {Appbar, IconButton, Searchbar, useTheme} from 'react-native-paper';
import {Linking} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const CustomAppBar = ({navigation, route, options, back}) => {
  const {colors} = useTheme();
  const {top} = useSafeAreaInsets();

  const headerBg = options.headerStyle?.backgroundColor || colors.background;
  const headerTextColor = options.headerTintColor || (options.headerStyle?.backgroundColor ? '#ffffff' : colors.onSurface);

  return (
    <Appbar.Header
      statusBarHeight={top}
      style={{backgroundColor: headerBg, elevation: 3}}>
      {back ? (
        <IconButton 
          icon="chevron-left" 
          size={29} 
          iconColor={headerTextColor} 
          onPress={() => navigation.canGoBack() && navigation.goBack()} 
        />
      ) : (
        <Appbar.Action 
          icon="menu" 
          iconColor={headerTextColor} 
          onPress={() => navigation.openDrawer()} 
        />
      )}
      {back ? (
        <Appbar.Content 
          title={options.title || route.name} 
          titleStyle={{color: headerTextColor, fontWeight: 'bold', fontSize: 18}} 
        />
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
          iconColor={headerTextColor}
          onPress={() => {
            navigation.navigate('Notifications');
          }}
        />
      )}
      {options?.showPhoneIcon && (
        <Appbar.Action
          icon="phone"
          iconColor={headerTextColor}
          onPress={() => {
            Linking.openURL('tel:8447186881');
          }}
        />
      )}
    </Appbar.Header>
  );
};

export default CustomAppBar;

