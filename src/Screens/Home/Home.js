import {Screen} from '../../Components/Screen';
import HomeHeader from '../../Components/Screen/HomeHeader';
import Banner from '../../Components/Screen/Banner';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import {Text} from '../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';

const Home = () => {
  const navigation = useNavigation();
  return (
    <Screen NoHeader style={{marginBottom: 50}}>
      <HomeHeader />
      <Banner />
      <TouchableOpacity
        onPress={() => navigation.navigate('TestGenerator')}
        style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="brain" size={30} color="white" />
          <Text size="medium" style={styles.cardTitle}>
            AI Test Generator
          </Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Generate customized practice tests for school subjects (CBSE/NCERT) or competitive exams like JEE, NEET, GATE, and CUET.
        </Text>
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#007171',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  cardTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardSubtitle: {
    color: '#e0f2f1',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default Home;
