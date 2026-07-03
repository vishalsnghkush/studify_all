import {View, FlatList, Image, ScrollView} from 'react-native';
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
  {
    label: 'Class 6th',
    value: 6,
    badge: 'Secondary',
    desc: 'Science, Maths, SST & English',
    icon: 'numeric-6-box',
    color: '#eef6f5',
    borderColor: '#10b981',
    iconBg: '#10b981',
  },
  {
    label: 'Class 7th',
    value: 7,
    badge: 'Secondary',
    desc: 'Science, Maths, SST & English',
    icon: 'numeric-7-box',
    color: '#eef6f5',
    borderColor: '#10b981',
    iconBg: '#10b981',
  },
  {
    label: 'Class 8th',
    value: 8,
    badge: 'Secondary',
    desc: 'Science, Maths, SST & English',
    icon: 'numeric-8-box',
    color: '#fff1f2',
    borderColor: '#f43f5e',
    iconBg: '#f43f5e',
  },
  {
    label: 'Class 9th',
    value: 9,
    badge: 'High School',
    desc: 'Physics, Chem, Bio, Maths, SST',
    icon: 'numeric-9-box',
    color: '#fff7ed',
    borderColor: '#ea580c',
    iconBg: '#ea580c',
  },
  {
    label: 'Class 10th',
    value: 10,
    badge: 'High School',
    desc: 'Physics, Chem, Bio, Maths, SST',
    icon: 'numeric-10-box',
    color: '#faf5ff',
    borderColor: '#8b5cf6',
    iconBg: '#8b5cf6',
  },
  {
    label: 'Class 11th',
    value: 11,
    badge: 'Senior Sec',
    desc: 'Science, Commerce & Humanities',
    textIcon: '11',
    color: '#ecfeff',
    borderColor: '#06b6d4',
    iconBg: '#06b6d4',
  },
  {
    label: 'Class 12th',
    value: 12,
    badge: 'Senior Sec',
    desc: 'Science, Commerce & Humanities',
    textIcon: '12',
    color: '#fdf4ff',
    borderColor: '#d946ef',
    iconBg: '#d946ef',
  },
];

const Notes = ({navigation}) => {
  const {colors, dark} = useTheme();
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
      {!hasSelectedClass ? (
        // INITIAL STATE: SHOW HERO CARD & 2-COLUMN GRID OF CLASS CARDS
        <ScrollView contentContainerStyle={{paddingBottom: 40}} showsVerticalScrollIndicator={false}>
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

          <View style={{paddingHorizontal: 16, marginTop: 10, paddingBottom: 30}}>
            <Text
              size="medium"
              style={{
                fontWeight: 'bold',
                color: colors.onSurface,
                marginBottom: 16,
              }}>
              Select your Class
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                rowGap: 14,
              }}>
              {classList.map(item => (
                <TouchableRipple
                  key={item.value}
                  onPress={() => updateFormValue({name: 'class', value: item.value})}
                  style={{
                    width: '48%',
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: colors.outlineVariant || 'rgba(0,0,0,0.06)',
                    backgroundColor: dark ? colors.surface : item.color,
                    padding: 12,
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                  }}>
                  <View style={{flexDirection: 'column', height: 155, justifyContent: 'space-between'}}>
                    {/* Badge & Icon Row */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: item.iconBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        {item.textIcon ? (
                          <Text style={{color: 'white', fontWeight: 'bold', fontSize: 13}}>{item.textIcon}</Text>
                        ) : (
                          <Micon name={item.icon} size={18} color="white" />
                        )}
                      </View>
                      <View
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.04)',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                        <Text style={{fontSize: 9, fontWeight: 'bold', color: colors.outline}}>{item.badge}</Text>
                      </View>
                    </View>

                    {/* Content Section */}
                    <View style={{marginTop: 10, flex: 1}}>
                      <Text style={{fontWeight: 'bold', fontSize: 15, color: colors.onSurface}}>{item.label}</Text>
                      <Text numberOfLines={2} style={{fontSize: 11, color: colors.outline, marginTop: 4, lineHeight: 14}}>
                        {item.desc}
                      </Text>
                    </View>

                    {/* View Notes Action */}
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10}}>
                      <Text style={{fontWeight: 'bold', fontSize: 12, color: item.borderColor}}>View Notes</Text>
                      <Micon name="chevron-right" size={16} color={item.borderColor} />
                    </View>
                  </View>
                </TouchableRipple>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        // ACTIVE STATE: SHOW ACTIVE CLASS HEADER WITH BACK BUTTON & LIST OF NOTES
        <View style={{flex: 1, paddingHorizontal: 16, marginTop: 10}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
            <TouchableRipple
              onPress={() => setForm(undefined)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: colors.surfaceVariant || 'rgba(0,0,0,0.05)',
              }}>
              <>
                <Micon name="arrow-left" size={18} color={colors.primary} />
                <Text style={{fontWeight: 'bold', fontSize: 13, color: colors.primary, marginLeft: 4}}>
                  Back to Classes
                </Text>
              </>
            </TouchableRipple>
            <Text style={{fontWeight: 'bold', fontSize: 16, color: colors.onSurface, marginLeft: 16}}>
              Class {form} Notes
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text size="small" style={{marginTop: 10, color: colors.outline}}>
                Fetching study materials...
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
              contentContainerStyle={{paddingBottom: 40}}
              renderItem={({item}) => {
                const subjectInfo = getSubjectInfo(item.subject);
                return (
                  <TouchableRipple
                    onPress={() => {
                      navigation.navigate('Pdf', {url: item.pdf_url});
                    }}
                    style={[
                      styles.noteCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.outlineVariant || 'rgba(0,0,0,0.05)',
                      },
                    ]}>
                    <View style={styles.cardRow}>
                      <View style={[styles.iconBadge, {backgroundColor: subjectInfo.bg}]}>
                        <Micon
                          name={subjectInfo.icon}
                          size={24}
                          color={subjectInfo.color}
                        />
                      </View>
                      <View style={styles.cardDetails}>
                        <Text
                          style={[styles.noteName, {color: colors.onSurface}]}>
                          {item.name}
                        </Text>
                        <View style={styles.metaRow}>
                          <View
                            style={[
                              styles.badge,
                              {backgroundColor: subjectInfo.bg},
                            ]}>
                            <Text
                              style={[
                                styles.badgeText,
                                {color: subjectInfo.color},
                              ]}>
                              {item.subject}
                            </Text>
                          </View>
                          <Text
                            style={[styles.metaText, {color: colors.outline}]}>
                            Ch : {item.chapter_no}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.chapterName,
                            {color: colors.onSurfaceVariant},
                          ]}>
                          {item.chapter_name}
                        </Text>
                      </View>
                      <View style={styles.cardActionWrapper}>
                        <Micon
                          name="file-pdf-box"
                          size={32}
                          color="#e53935"
                        />
                      </View>
                    </View>
                  </TouchableRipple>
                );
              }}
            />
          )}
        </View>
      )}
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
