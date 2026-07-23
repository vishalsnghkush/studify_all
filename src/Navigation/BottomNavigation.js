import {createMaterialBottomTabNavigator} from 'react-native-paper/react-navigation';
import {Profile, OnlineTuitions} from '../Screens/Home';
import Notes from '../Screens/Home/Notes/Notes';
import Main from '../Screens/Home/Main';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector, useDispatch} from 'react-redux';
import {useEffect} from 'react';
import useApi from '../Components/Api/Api';
import {setUnreadDiscussion} from '../Redux/Slices/InitialSlice';
import Groups from '../Screens/Home/Chat/Groups';
import DiscussionForum from '../Screens/Home/Chat/DiscussionForum';

const Tab = createMaterialBottomTabNavigator();

export default function BottomNavigation() {
  const theme = useTheme();
  const {bottom} = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {get} = useApi();
  const {user, hasUnreadDiscussion, lastSeenMsgId} = useSelector(
    state => state.initial,
  );

  useEffect(() => {
    if (user?.is_intern || !user?.class) {
      return;
    }

    const checkNewMessages = async () => {
      try {
        const res = await get(
          `/user/discussion/messages?class=${user.class}&subject=General`,
          {skipSuccessFlash: true, skipErrorFlash: true},
        );
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const latestId = res.data[res.data.length - 1].id;
          if (latestId > lastSeenMsgId) {
            dispatch(setUnreadDiscussion(true));
          }
        }
      } catch (err) {
        console.log('Background badge check error:', err);
      }
    };

    checkNewMessages();
    const interval = setInterval(checkNewMessages, 20000);
    return () => clearInterval(interval);
  }, [user?.class, lastSeenMsgId]);

  return (
    <>
      <Tab.Navigator
        activeColor={theme.colors.primary}
        inactiveColor={theme.colors.onSurfaceVariant}
        barStyle={{
          backgroundColor: theme.colors.background,
          paddingBottom: bottom,
        }}
        screenOptions={{
          tabBarHideOnKeyboard: true,
          headerShown: false,
        }}>
        <Tab.Screen
          name="Home"
          component={Main}
          options={{
            title: 'Home',
            tabBarIcon: ({focused}) => (
              <Micon
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={
                  focused ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
            ),
          }}
        />
        <Tab.Screen
          name="Notes"
          component={Notes}
          options={{
            title: 'Study',
            tabBarIcon: ({focused}) => (
              <Micon
                name={focused ? 'book-open-variant' : 'book-open-blank-variant'}
                size={23}
                color={
                  focused ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
            ),
          }}
        />
        <Tab.Screen
          name="GroupsOrForum"
          component={user?.is_intern ? Groups : DiscussionForum}
          options={{
            title: user?.is_intern ? 'Chat' : 'Discussion',
            tabBarBadge: !user?.is_intern && hasUnreadDiscussion ? '•' : null,
            tabBarIcon: ({focused}) => (
              <Micon
                name={
                  user?.is_intern
                    ? focused
                      ? 'chat'
                      : 'chat-outline'
                    : focused
                    ? 'forum'
                    : 'forum-outline'
                }
                size={23}
                color={
                  focused ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
            ),
          }}
        />
        <Tab.Screen
          name="OnlineTuitions"
          component={OnlineTuitions}
          options={{
            title: 'Tutions',
            tabBarIcon: ({focused}) => (
              <Micon
                name={focused ? 'school' : 'school-outline'}
                size={24}
                color={
                  focused ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({focused}) => (
              <Micon
                name={focused ? 'account-circle' : 'account-circle-outline'}
                size={24}
                color={
                  focused ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}
