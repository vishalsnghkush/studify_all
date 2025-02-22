import {Screen} from '../../../Components/Screen';
import {Text} from '../../../Components/Input';
import {TouchableOpacity, StyleSheet, View, Image} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
const Notes = ({navigation}) => {
  return (
    <Screen NoHeader list>
      <TouchableOpacity
        onPress={() => navigation.navigate('FreeNotes')}
        style={styles.youtubeNotes}>
        <Icon name="youtube" size={28} color="#007171" />
        <Text size="medium">YouTube Notes</Text>
      </TouchableOpacity>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Image
          source={require('../../../Assets/Images/college.png')}
          style={{
            height: 250,
            width: '90%',
            objectFit: 'cover',
          }}
        />
        <Text style={{fontSize: 22}}>Other Notes are coming soon!</Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  youtubeNotes: {
    padding: 10,
    paddingVertical: 15,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    borderColor: '#007171',
    borderRadius: 10,
    gap: 10,
    alignItems: 'center',
    marginTop: 30,
  },
});
export default Notes;
