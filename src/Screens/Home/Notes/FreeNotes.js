import {View, FlatList, Image} from 'react-native';
import {useState} from 'react';
import {Screen} from '../../../Components/Screen';
import Dropdown from '../../../Components/Input/Dropdown';
import useApi from '../../../Components/Api/Api';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator, TouchableRipple, useTheme} from 'react-native-paper';
import {Text} from '../../../Components/Input';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

const getSubjectInfo = (subject) => {
  const s = subject?.toLowerCase() || '';
  if (s.includes('math')) return { icon: 'calculator', color: '#673ab7', bg: '#ede7f6' };
  if (s.includes('sci') || s.includes('physic') || s.includes('chemist') || s.includes('bio')) return { icon: 'flask-outline', color: '#009688', bg: '#e0f2f1' };
  if (s.includes('english')) return { icon: 'translate', color: '#3f51b5', bg: '#e8eaf6' };
  if (s.includes('social') || s.includes('history') || s.includes('geography') || s.includes('civics')) return { icon: 'earth', color: '#e65100', bg: '#fff3e0' };
  return { icon: 'file-document-outline', color: '#007171', bg: '#e0f2f2' };
};

const classList = [
  {label: 'Class 6th', value: 6},
  {label: 'Class 7th', value: 7},
  {label: 'Class 8th', value: 8},
  {label: 'Class 9th', value: 9},
  {label: 'Class 10th', value: 10},
  {label: 'Class 11th', value: 11},
  {label: 'Class 12th', value: 12},
];

const Notes = ({navigation}) => {
  const {colors} = useTheme();
  const [form, setForm] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({});
  const refetch = async vale => {
    setIsLoading(true);
    try {
      const res = await useApi().get(`/notes?cls=${vale}`);
      console.log(vale);
      setData(res);
    } catch (err) {
      console.log(err);
    }
    setIsLoading(false);
  };

  const updateFormValue = ({name, value}) => {
    setForm(value);
    refetch(value);
  };

  const hasSelectedClass = form !== undefined && form !== null;

  return (
    <Screen list style={{backgroundColor: colors.background}}>
      {/* 1. HERO HEADER CARD */}
      <View style={[styles.heroCard, {backgroundColor: colors.surface}]}>
        <View style={styles.heroLeft}>
          <View style={[styles.heroIconWrapper, {backgroundColor: '#ffebee'}]}>
            <Micon name="youtube" size={28} color="#ff0000" />
          </View>
        </View>
        <View style={styles.heroRight}>
          <Text
            size="medium"
            style={[styles.heroTitle, {color: colors.onSurface}]}>
            YouTube Notes 📝
          </Text>
          <Text
            size="small"
            style={[styles.heroSubtitle, {color: colors.outline}]}>
            Premium handwritten chapter notes directly from our video lectures.
          </Text>
        </View>
      </View>

      {/* 2. SELECT CLASS CONTAINER */}
      <View style={styles.dropdownContainer}>
        <Dropdown
          label="Select Class"
          name="class"
          value={form}
          updateFormValue={updateFormValue}
          list={classList}
          style={{flex: 1}}
        />
      </View>

      {/* 3. MAIN CONTENT CONTAINER */}
      <View style={{flex: 1, marginTop: 10}}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text size="small" style={{marginTop: 10, color: colors.outline}}>
              Fetching study materials...
            </Text>
          </View>
        ) : !hasSelectedClass ? (
          // BEFORE CLASS SELECTION
          <View style={[styles.placeholderCard, {backgroundColor: colors.surface}]}>
            <Micon name="gesture-tap-select" size={48} color={colors.primary} />
            <Text
              size="medium"
              style={[styles.placeholderTitle, {color: colors.onSurface}]}>
              No Class Selected
            </Text>
            <Text
              size="small"
              style={[styles.placeholderSubtitle, {color: colors.outline}]}>
              Choose a class from the dropdown above to view and download available chapter PDFs.
            </Text>
          </View>
        ) : data?.data?.length === 0 ? (
          <View style={styles.centerContainer}>
            <Image
              source={require('../../../Assets/Images/nodata.png')}
              style={styles.noDataImage}
            />
            <Text size="medium" style={{fontWeight: 'bold', color: colors.onSurface, marginTop: 15}}>
              No Notes Found
            </Text>
            <Text size="small" style={{color: colors.outline, textAlign: 'center', marginTop: 4, paddingHorizontal: 40}}>
              We couldn't find any YouTube notes for Class {form} at this moment. Check back soon!
            </Text>
          </View>
        ) : (
          <FlatList
            data={data?.data}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{paddingBottom: 20}}
            renderItem={({item}) => {
              const subjectInfo = getSubjectInfo(item.subject);
              return (
                <TouchableRipple
                  onPress={() => {
                    navigation.navigate('Pdf', {url: item.pdf_url});
                  }}
                  rippleColor="rgba(0,113,113,0.1)"
                  style={[
                    styles.noteCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.outlineVariant,
                    },
                  ]}>
                  <View style={styles.cardRow}>
                    {/* Subject Icon Badge */}
                    <View style={[styles.iconBadge, {backgroundColor: subjectInfo.bg}]}>
                      <Micon name={subjectInfo.icon} size={24} color={subjectInfo.color} />
                    </View>

                    {/* Note Details */}
                    <View style={styles.cardDetails}>
                      <Text
                        size="medium"
                        numberOfLines={1}
                        style={[styles.noteName, {color: colors.onSurface}]}>
                        {item.name}
                      </Text>
                      
                      <View style={styles.metaRow}>
                        <View style={[styles.badge, {backgroundColor: colors.surfaceVariant}]}>
                          <Text size="small" style={[styles.badgeText, {color: colors.onSurfaceVariant}]}>
                            {item.subject}
                          </Text>
                        </View>
                        {item.chapter_no && (
                          <Text size="small" style={[styles.metaText, {color: colors.outline}]}>
                            Ch {item.chapter_no}
                          </Text>
                        )}
                      </View>
                      
                      {item.chapter_name && (
                        <Text
                          size="small"
                          numberOfLines={1}
                          style={[styles.chapterName, {color: colors.outline}]}>
                          {item.chapter_name}
                        </Text>
                      )}
                    </View>

                    {/* Action Arrow */}
                    <View style={styles.cardActionWrapper}>
                      <Micon name="chevron-right" size={24} color={colors.primary} />
                    </View>
                  </View>
                </TouchableRipple>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
};

const styles = {
  heroCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  heroLeft: {
    justifyContent: 'center',
    marginRight: 14,
  },
  heroIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRight: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  dropdownContainer: {
    marginBottom: 10,
    zIndex: 10,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 20,
    marginTop: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  placeholderTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  placeholderSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  noDataImage: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
  noteCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardDetails: {
    flex: 1,
  },
  noteName: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chapterName: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  cardActionWrapper: {
    justifyContent: 'center',
    marginLeft: 8,
  },
};

export default Notes;
