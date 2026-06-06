import React from 'react';
import {Screen} from '../../../Components/Screen';
import {Text} from '../../../Components/Input';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';

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
      actionText: 'Watch & Learn',
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
      actionText: 'View Solutions',
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
      actionText: 'View Questions',
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
      actionText: 'Start Quiz',
    },
    {
      title: 'Science Keywords',
      desc: 'Important science keywords for Class 6th to 8th.',
      url: 'Keywords',
      isStack: true,
      color: dark ? 'rgba(0, 113, 113, 0.15)' : '#eef6f5',
      borderColor: '#007171',
      icon: 'key-variant',
      badge: 'KEYWORDS',
      category: 'free',
      actionText: 'View Keywords',
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
      actionText: 'Access Chapters',
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
      actionText: 'Get Combo',
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
        styles.bannerCard,
        {
          backgroundColor: dark ? colors.surface : item.color,
          borderColor: dark
            ? colors.outlineVariant
            : item.borderColor + '33' || '#eceff1',
        },
      ]}>
      <View style={styles.bannerTextContainer}>
        {item.badge && (
          <Text
            style={[
              styles.bannerBadgeText,
              {color: dark ? colors.secondary : item.borderColor},
            ]}>
            {item.badge}
          </Text>
        )}
        <Text
          style={[
            styles.bannerCardTitle,
            {color: dark ? '#ffffff' : '#263238'},
          ]}>
          {item.title}
        </Text>
        <Text
          style={[
            styles.bannerCardDesc,
            {color: dark ? '#b0bec5' : '#546e7a'},
          ]}>
          {item.desc}
        </Text>
        <View
          style={[
            styles.bannerBtn,
            {backgroundColor: dark ? colors.primary : item.borderColor},
          ]}>
          <Text style={styles.bannerBtnText}>
            {item.actionText || 'Access'}
          </Text>
          <Icon
            name={item.isStack ? 'chevron-right' : 'open-in-new'}
            size={14}
            color="#ffffff"
            style={styles.btnIcon}
          />
        </View>
      </View>
      <View
        style={[
          styles.bannerIconCircle,
          {
            backgroundColor: dark
              ? 'rgba(255, 255, 255, 0.05)'
              : item.borderColor + '15' || '#f5f5f5',
          },
        ]}>
        <Icon
          name={item.icon}
          size={36}
          color={dark ? colors.primary : item.borderColor}
        />
      </View>
    </TouchableOpacity>
  );

  const freeItems = noteTypes.filter(item => item.category === 'free');
  const paidItems = noteTypes.filter(item => item.category === 'paid');

  return (
    <Screen NoHeader>
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
  bannerCard: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  bannerTextContainer: {
    flex: 1.3,
    justifyContent: 'center',
  },
  bannerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bannerCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  bannerBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 4,
  },
  bannerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default Notes;
