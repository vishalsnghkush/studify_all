import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {Text} from '../../Components/Input';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from 'react-native-paper';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 column layout with padding

const ClassNotesSelector = () => {
  const navigation = useNavigation();
  const {colors, dark} = useTheme();

  const classes = [
    {
      title: 'Class 1 - 5',
      url: 'https://junior.studifysuccess.com/#junior-notes',
      color: '#eef6f5',
      borderColor: '#0284c7',
      icon: 'school',
    },
    {
      title: 'Class 6th',
      url: 'https://www.studifysuccess.com/notes/class-6-notes/',
      color: '#f1f8e9',
      borderColor: '#10b981',
      icon: 'numeric-6-box',
    },
    {
      title: 'Class 7th',
      url: 'https://www.studifysuccess.com/notes/class-7-notes/',
      color: '#e8eaf6',
      borderColor: '#6366f1',
      icon: 'numeric-7-box',
    },
    {
      title: 'Class 8th',
      url: 'https://www.studifysuccess.com/notes/class-8-notes/',
      color: '#ffebee',
      borderColor: '#f43f5e',
      icon: 'numeric-8-box',
    },
    {
      title: 'Class 9th',
      url: 'https://www.studifysuccess.com/notes/class-9-notes/',
      color: '#fff3e0',
      borderColor: '#f59e0b',
      icon: 'numeric-9-box',
    },
    {
      title: 'Class 10th',
      url: 'https://www.studifysuccess.com/notes/class-10-notes/',
      color: '#f3e5f5',
      borderColor: '#d946ef',
      icon: 'numeric-10-box',
    },
    {
      title: 'Class 11th',
      url: 'https://www.studifysuccess.com/notes/class-11-notes/',
      color: '#e0f7fa',
      borderColor: '#06b6d4',
      textIcon: '11',
    },
    {
      title: 'Class 12th',
      url: 'https://www.studifysuccess.com/notes/class-12-notes/',
      color: '#ede7f6',
      borderColor: '#8b5cf6',
      textIcon: '12',
    },
  ];

  const handlePress = url => {
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
          Select Your Class
        </Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, {color: colors.onSurfaceVariant}]}>
          Choose your class to view and download chapter-wise study notes.
        </Text>

        <View style={styles.grid}>
          {classes.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(item.url)}
              style={[
                styles.card,
                {
                  backgroundColor: dark ? colors.surface : item.color,
                  borderColor: dark ? colors.outline : item.borderColor,
                },
              ]}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: dark
                      ? 'rgba(139, 92, 246, 0.12)'
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
                View Notes →
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
    color: '#546e7a',
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 4,
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
    color: '#263238',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardAction: {
    fontSize: 11,
    fontWeight: '600',
    color: '#546e7a',
  },
});

export default ClassNotesSelector;
