import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '../../../Components/Input';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from 'react-native-paper';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {trackEngagement, setRecentNote} from '../../../Utils/EngagementTracker';

const {width} = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 column layout with padding

const ImportantQuestions = () => {
  const navigation = useNavigation();
  const {colors, dark} = useTheme();

  const classes = [
    {
      title: 'Class 6th',
      url: 'https://www.studifysuccess.com/important-questions/class-6/',
      color: '#eef6f5',
      borderColor: '#0284c7',
      icon: 'numeric-6-box',
    },
    {
      title: 'Class 7th',
      url: 'https://www.studifysuccess.com/important-questions/class-7/',
      color: '#eef6f5',
      borderColor: '#10b981',
      icon: 'numeric-7-box',
    },
    {
      title: 'Class 8th',
      url: 'https://www.studifysuccess.com/important-questions/class-8/',
      color: '#eef6f5',
      borderColor: '#6366f1',
      icon: 'numeric-8-box',
    },
    {
      title: 'Class 9th',
      url: 'https://www.studifysuccess.com/important-questions/class-9/',
      color: '#eef6f5',
      borderColor: '#f43f5e',
      icon: 'numeric-9-box',
    },
    {
      title: 'Class 10th',
      url: 'https://www.studifysuccess.com/important-questions/class-10/',
      color: '#eef6f5',
      borderColor: '#f59e0b',
      icon: 'numeric-10-box',
    },
    {
      title: 'Class 11th',
      url: 'https://www.studifysuccess.com/important-questions/class-11/',
      color: '#eef6f5',
      borderColor: '#d946ef',
      textIcon: '11',
    },
    {
      title: 'Class 12th',
      url: 'https://www.studifysuccess.com/important-questions/class-12/',
      color: '#eef6f5',
      borderColor: '#8b5cf6',
      textIcon: '12',
    },
  ];

  const handlePress = (url, title) => {
    trackEngagement('General', 'note');
    setRecentNote({
      name: `Important Qs - ${title}`,
      subject: 'General',
      type: 'note',
      board: '',
      class: title,
      subtopic: ''
    });
    navigation.navigate('WebView', {url});
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.header, {borderBottomColor: colors.outlineVariant}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Micon name="arrow-left" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.onBackground}]}>
          Important Questions
        </Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, {color: colors.onSurfaceVariant}]}>
          Select your class to view step-by-step textbook solutions.
        </Text>

        <View style={styles.grid}>
          {classes.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(item.url, item.title)}
              style={[
                styles.card,
                {
                  backgroundColor: dark ? colors.surface : item.color,
                  borderColor: dark ? colors.outlineVariant : item.borderColor,
                },
              ]}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: dark
                      ? 'rgba(0, 113, 113, 0.12)'
                      : item.borderColor,
                  },
                ]}>
                {item.textIcon ? (
                  <Text
                    style={{
                      color: dark ? colors.primary : 'white',
                      fontWeight: 'bold',
                      fontSize: 18,
                    }}>
                    {item.textIcon}
                  </Text>
                ) : (
                  <Micon
                    name={item.icon}
                    size={26}
                    color={dark ? colors.primary : 'white'}
                  />
                )}
              </View>
              <Text style={[styles.cardTitle, {color: colors.onSurface}]}>
                {item.title}
              </Text>
              <Text style={[styles.cardAction, {color: colors.primary}]}>
                View Questions →
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardAction: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ImportantQuestions;
