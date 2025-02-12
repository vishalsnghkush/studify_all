import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import {DarkTheme, LightTheme} from './Utils/Theme';
import {NavigationContainer} from '@react-navigation/native';
import {AuthNavigation, AppNavigation} from './Navigation';
import {StatusBar} from 'react-native';
import {useSelector, shallowEqual} from 'react-redux';
import {BottomSheet} from './Components/Screen';
import FlashMessage from 'react-native-flash-message';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import CheckAuth from './Components/Api/CheckAuth';
import NoInternet from './Screens/Home/NoInternet';
const queryClient = new QueryClient();
const LightMode = {
  ...MD3LightTheme,
  colors: LightTheme,
};

const DarkMode = {
  ...MD3DarkTheme,
  colors: DarkTheme,
};
const App = () => {
  const {isDark, isUserLoggedIn} = useSelector(
    state => ({
      isDark: state.initial.isDark,
      isUserLoggedIn: state.initial.isUserLoggedIn,
    }),
    shallowEqual,
  );
  const theme = isDark ? DarkMode : LightMode;

  const linking = {
    prefixes: ['https://studifysuccess.com/app'],
    config: {
      screens: {
        Meet: 'meet/:search',
      },
    },
  };

  return (
    <PaperProvider theme={theme}>
      <CheckAuth />
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <NavigationContainer linking={linking}>
        <QueryClientProvider client={queryClient}>
          {isUserLoggedIn ? <AppNavigation /> : <AuthNavigation />}
        </QueryClientProvider>
      </NavigationContainer>
      <BottomSheet />
      <FlashMessage />
      <NoInternet />
    </PaperProvider>
  );
};

export default App;
