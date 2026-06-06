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
      color: dark ? 'rgba(244, 63, 94, 0.08)' : 'rgba(244, 63, 94, 0.05)',
      borderColor: colors.tertiary,
      icon: 'youtube',
      badge: 'FREE',
      category: 'free',
      accent: colors.tertiary,
    },
    {
      title: 'Chapter-Wise Notes',
      desc: 'In-depth coverage of all concepts. High scores guaranteed.',
      url: 'https://allstudynotes.studifysuccess.com/select-class-chapter?mobile=true',
      isStack: false,
      color: dark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)',
      borderColor: colors.primary,
      icon: 'file-document-multiple-outline',
      badge: 'CHAPTERS',
      category: 'paid',
      accent: colors.primary,
    },
    {
      title: 'Combo Study Notes',
      desc: 'Full syllabus bundles. Quick revision summaries.',
      url: 'https://allstudynotes.studifysuccess.com/select-class-subject?mobile=true',
      isStack: false,
      color: dark ? 'rgba(14, 165, 233, 0.08)' : 'rgba(14, 165, 233, 0.05)',
      borderColor: colors.secondary,
      icon: 'book-open-page-variant',
      badge: 'COMBO',
      category: 'paid',
      accent: colors.secondary,
    },
  ];

  const handlePress = item => {
    if (item.isStack) {
      navigation.navigate(item.url);
    } else {
      navigation.navigate('WebView', {url: item.url});
    }
  };

  const renderCard = (item, index) => {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => handlePress(item)}
        style={[
          styles.gridCard,
          {
            backgroundColor: dark ? colors.surface : item.color,
            borderColor: dark ? colors.outline : item.borderColor,
            width: width - 32,
          },
        ]}>
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.gridIconCircle,
              {
                backgroundColor: dark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : item.color,
                borderColor: item.borderColor,
                borderWidth: 1,
              },
            ]}>
            <Icon name={item.icon} size={22} color={item.accent} />
          </View>
          <View style={styles.cardTitleCol}>
            <Text style={[styles.gridCardTitle, {color: colors.onSurface}]}>
              {item.title}
            </Text>
            {item.badge && (
              <View
                style={[styles.gridBadge, {backgroundColor: item.borderColor}]}>
                <Text style={styles.gridBadgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.gridCardDesc, {color: colors.onSurfaceVariant}]}>
          {item.desc}
        </Text>
      </TouchableOpacity>
    );
  };

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
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  list: {
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleCol: {
    marginLeft: 12,
    flex: 1,
  },
  gridIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  gridCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  gridBadge: {
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  gridBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export default Notes;
