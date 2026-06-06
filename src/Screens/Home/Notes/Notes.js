import React from 'react';
import {Screen} from '../../../Components/Screen';
import {Text} from '../../../Components/Input';
import {TouchableOpacity, StyleSheet, View, Dimensions} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';

const {width} = Dimensions.get('window');

const Notes = ({navigation}) => {
  const {colors, dark} = useTheme();

  const noteTypes = [
    {
      title: 'YouTube Notes',
      desc: 'High quality free study notes mapped to video lectures.',
      url: 'FreeNotes',
      isStack: true,
      color: dark ? 'rgba(198, 40, 40, 0.15)' : '#ffebee',
      borderColor: '#c62828',
      icon: 'youtube',
      badge: 'FREE',
      category: 'free',
    },
    {
      title: 'NCERT Solutions',
      desc: 'Free textbook solutions for all classes and subjects.',
      url: 'NcertSolutions',
      isStack: true,
      color: dark ? 'rgba(0, 113, 113, 0.15)' : '#eef6f5',
      borderColor: '#007171',
      icon: 'notebook-check-outline',
      badge: 'NCERT',
      category: 'free',
    },
    {
      title: 'Important Questions',
      desc: 'Important textbook questions for all classes and subjects.',
      url: 'ImportantQuestions',
      isStack: true,
      color: dark ? 'rgba(0, 113, 113, 0.15)' : '#eef6f5',
      borderColor: '#007171',
      icon: 'file-question-outline',
      badge: 'IMP Q',
      category: 'free',
    },
    {
      title: 'Online Quiz',
      desc: 'Free textbook quizzes for all classes and subjects.',
      url: 'OnlineQuiz',
      isStack: true,
      color: dark ? 'rgba(0, 113, 113, 0.15)' : '#eef6f5',
      borderColor: '#007171',
      icon: 'chat-question-outline',
      badge: 'QUIZ',
      category: 'free',
    },
    {
      title: 'Chapter-Wise Notes',
      desc: 'In-depth coverage of all concepts. High scores guaranteed.',
      url: 'https://allstudynotes.studifysuccess.com/select-class-chapter?mobile=true',
      isStack: false,
      color: dark ? 'rgba(0, 113, 113, 0.15)' : '#eef6f5',
      borderColor: '#007171',
      icon: 'file-document-multiple-outline',
      badge: 'CHAPTERS',
      category: 'paid',
    },
    {
      title: 'Combo Study Notes',
      desc: 'Full syllabus bundles. Quick revision summaries.',
      url: 'https://allstudynotes.studifysuccess.com/select-class-subject?mobile=true',
      isStack: false,
      color: dark ? 'rgba(230, 81, 0, 0.15)' : '#fff3e0',
      borderColor: '#e65100',
      icon: 'book-open-page-variant',
      badge: 'COMBO',
      category: 'paid',
    },
  ];

  const handlePress = item => {
    if (item.isStack) {
      navigation.navigate(item.url);
    } else {
      navigation.navigate('WebView', {url: item.url});
    }
  };

  const renderCard = (item, index) => (
    <TouchableOpacity
      key={index}
      onPress={() => handlePress(item)}
      style={[
        styles.gridCard,
        {
          backgroundColor: item.color,
          borderColor: item.borderColor,
          width: width - 32,
        },
      ]}>
      <View
        style={[styles.gridIconCircle, {backgroundColor: item.borderColor}]}>
        <Icon name={item.icon} size={26} color="white" />
      </View>
      <Text
        style={[styles.gridCardTitle, {color: dark ? '#ffffff' : '#263238'}]}>
        {item.title}
      </Text>
      <Text
        style={[styles.gridCardDesc, {color: dark ? '#b0bec5' : '#546e7a'}]}>
        {item.desc}
      </Text>
      {item.badge && (
        <View style={[styles.gridBadge, {backgroundColor: item.borderColor}]}>
          <Text style={styles.gridBadgeText}>{item.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const freeItems = noteTypes.filter(item => item.category === 'free');
  const paidItems = noteTypes.filter(item => item.category === 'paid');

  return (
    <Screen NoHeader style={{flex: 1}}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: dark ? colors.surface : '#ffffff',
            borderBottomColor: dark ? colors.outlineVariant : '#eceff1',
          },
        ]}>
        <Text
          style={[
            styles.headerTitle,
            {color: dark ? colors.onSurface : '#1a1d1d'},
          ]}>
          Study Notes & Materials
        </Text>
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.sectionHeading,
            {color: dark ? colors.onBackground : '#1a1d1d'},
          ]}>
          Free Notes
        </Text>
        <View style={styles.list}>
          {freeItems.map((item, index) => renderCard(item, index))}
        </View>

        <Text
          style={[
            styles.sectionHeading,
            {color: dark ? colors.onBackground : '#1a1d1d'},
          ]}>
          Paid Notes
        </Text>
        <View style={styles.list}>
          {paidItems.map((item, index) => renderCard(item, index))}
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 12,
  },
  list: {
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  gridCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  gridBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  gridBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default Notes;
