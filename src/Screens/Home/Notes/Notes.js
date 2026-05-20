import {Screen} from '../../../Components/Screen';
import {Text} from '../../../Components/Input';
import {TouchableOpacity, StyleSheet, View, Image} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
const Notes = ({navigation}) => {
  return (
    <Screen NoHeader list>
      <View>
        <Text style={styles.heading}>Free Notes</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('FreeNotes')}
          style={styles.youtubeNotes}>
          <Icon name="youtube" size={40} color="#007171" />
          <Text size="medium">YouTube Notes</Text>
        </TouchableOpacity>
      </View>
      <View>
        <Text style={styles.heading}>Paid Notes</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('WebView', {
              url: 'https://allstudynotes.studifysuccess.com/select-class-chapter?mobile=true',
            })
          }
          style={styles.youtubeNotes}>
          <Icon name="file" size={40} color="#007171" />
          <Text size="medium">Chapter Wise Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('WebView', {
              url: 'https://allstudynotes.studifysuccess.com/select-class-subject?mobile=true',
            })
          }
          style={styles.youtubeNotes}>
          <Icon name="book" size={40} color="#007171" />
          <Text size="medium">Combo Notes</Text>
        </TouchableOpacity>
      </View>
      <View>
        <Text style={styles.heading}>Practice & Testing</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('TestGenerator')}
          style={styles.youtubeNotes}>
          <Icon name="brain" size={40} color="#007171" />
          <Text size="medium">AI Test Generator</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  youtubeNotes: {
    padding: 10,
    paddingVertical: 15,
    flexDirection: 'column',
    borderWidth: 2,
    justifyContent: 'center',
    borderColor: '#007171',
    borderRadius: 10,
    gap: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
  },
});
export default Notes;
