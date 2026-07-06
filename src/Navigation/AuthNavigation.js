import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';
import {AppBar} from '../Components/Navigation';
import {lazy, Suspense} from 'react';
import {Text} from '../Components/Input';
import OnBoarding from '../Screens/Auth/OnBoarding';
import Otp from '../Screens/Auth/Otp';
import ResetPassword from '../Screens/Auth/ResetPassword';
const Signin = lazy(() => import('../Screens/Auth/Sign_in'));
const Signup = lazy(() => import('../Screens/Auth/Sign_up'));
const ForgetPassword = lazy(() => import('../Screens/Auth/ForgetPassword'));
const Stack = createStackNavigator();

const AuthNavigation = () => {

  return (
    <Suspense fallback={() => <Text style={{marginTop: 100}}>Loading...</Text>}>
      <Stack.Navigator
        screenOptions={{
          header: props => <AppBar {...props} />,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}>
        <Stack.Screen
          options={{headerShown: false}}
          name="OnBoarding"
          component={OnBoarding}
        />
        <Stack.Screen
          name="Signup"
          options={{title: 'Sign up'}}
          component={Signup}
        />
        <Stack.Screen
          name="Signin"
          options={{headerShown: false}}
          component={Signin}
        />
        <Stack.Screen
          name="ForgetPassword"
          options={{title: 'Forgot Password'}}
          component={ForgetPassword}
        />
        <Stack.Screen
          name="Otp"
          options={{title: 'OTP Verification'}}
          component={Otp}
        />
        <Stack.Screen
          name="ResetPassword"
          options={{title: 'Reset Password'}}
          component={ResetPassword}
        />
      </Stack.Navigator>
    </Suspense>
  );
};

export default AuthNavigation;
