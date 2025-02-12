import {View, StyleSheet} from 'react-native';
import {IconButton, Searchbar} from 'react-native-paper';
import {Text} from '../Input';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

var myDate = new Date();
var hrs = myDate.getHours();
var greet;
if (hrs < 12) greet = 'Good Morning 👋';
else if (hrs >= 12 && hrs <= 17) greet = 'Good Afternoon 👋';
else if (hrs >= 17 && hrs <= 24) greet = 'Good Evening 👋';
else greet = 'Welcome 👋';
const HomeHeader = () => {
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  return (
    <View>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <IconButton
            icon="sort-variant"
            size={25}
            onPress={() => {
              navigation.openDrawer();
            }}
          />
          <View>
            <Text size="medium">{greet}</Text>
            <Text style={{fontWeight: 'bold'}}>
              {user.fname + ' ' + user.lname}
            </Text>
          </View>
        </View>
        <IconButton
          icon="bell"
          color="white"
          size={23}
          onPress={() => {
            navigation.navigate('Notifications');
          }}
        />
      </View>
      <Searchbar
        placeholder="Search"
        // onPressIn={() => navigation.navigate('Search')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
export default HomeHeader;
