import {View, FlatList, Image, ScrollView, Dimensions} from 'react-native';
import {useState, useEffect} from 'react';
import {Screen} from '../../../Components/Screen';
import {ActivityIndicator, TouchableRipple, useTheme} from 'react-native-paper';
import {Text} from '../../../Components/Input';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {trackEngagement, setRecentNote, getTopEngagedSubjects} from '../../../Utils/EngagementTracker';

const {width} = Dimensions.get('window');

const getSubjectInfo = (subject) => {
  const s = subject?.toLowerCase() || '';
  if (s.includes('math')) return { icon: 'calculator', color: '#673ab7', bg: '#ede7f6' };
  if (s.includes('sci') || s.includes('physic') || s.includes('chemist') || s.includes('bio')) return { icon: 'flask-outline', color: '#009688', bg: '#e0f2f1' };
  if (s.includes('english')) return { icon: 'translate', color: '#3f51b5', bg: '#e8eaf6' };
  if (s.includes('social') || s.includes('history') || s.includes('geography') || s.includes('civics')) return { icon: 'earth', color: '#e65100', bg: '#fff3e0' };
  return { icon: 'notebook-outline', color: '#6a148c', bg: '#f3e5f5' };
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

// Statics lectures data derived from the Google Drive shared folder
const lecturesData = {
  12: [
    {
      id: '1_dL5QvCx9pP4miWBy7ttjZgKBfxdAPOs',
      name: 'Accounting for Companies Part 1',
      subject: 'Accounts',
      chapter_no: 'Company Accounts',
      chapter_name: 'Issue of Shares',
    },
    {
      id: '1F8ShpB1-gHR3toJae3CK-nu1xVuVfPGa',
      name: 'Accounting for Companies Part 1 (Alt)',
      subject: 'Accounts',
      chapter_no: 'Company Accounts',
      chapter_name: 'Issue of Shares',
    },
    {
      id: '1JV9m4avdhV4uO5vI1Tnc6YAMPlJFtiy2',
      name: 'Accounting for Companies Part 2',
      subject: 'Accounts',
      chapter_no: 'Company Accounts',
      chapter_name: 'Issue of Shares',
    },
    {
      id: '1Q-3d9BT02KGNqsYAKVZOTNDBdDNkTGqT',
      name: 'Accounting for Companies Part 3',
      subject: 'Accounts',
      chapter_no: 'Company Accounts',
      chapter_name: 'Issue of Shares',
    },
    {
      id: '1QkU62yzgDuvog9_TDMnT0pxDkC69alvP',
      name: 'Accounting for Companies Part 4',
      subject: 'Accounts',
      chapter_no: 'Company Accounts',
      chapter_name: 'Issue of Shares',
    },
    {
      id: '1Lme4tG_leS_Ok2CCGBbMP6f2V-M0-481',
      name: 'Accounting for Companies Part 5',
      subject: 'Accounts',
      chapter_no: 'Company Accounts',
      chapter_name: 'Issue of Shares',
    },
    {
      id: '1_tMSSCp9plIFYVBYjPZF3RbxP6f-IkRL',
      name: 'Accounting for Companies Part 6',
      subject: 'Accounts',
      chapter_no: 'Company Accounts',
      chapter_name: 'Issue of Shares',
    },
    {
      id: '1MG_lM098xeuPM3VT8GwQbW3JX2COCH0K',
      name: 'Accounting for Companies Part 7',
      subject: 'Accounts',
      chapter_no: 'Company Accounts',
      chapter_name: 'Issue of Shares',
    },
    {
      id: '1GYDKG895r9gDF0YoJQV4wZEFf9c4RTyO',
      name: 'Ch1 Part 2',
      subject: 'Accounts',
      chapter_no: 'Chapter 1',
      chapter_name: 'Introduction to Accounting',
    },
    {
      id: '1BbfOhZgzZa8YM-JcFYF3x5x6zdoeMPmm',
      name: 'Ch1 Part 3',
      subject: 'Accounts',
      chapter_no: 'Chapter 1',
      chapter_name: 'Introduction to Accounting',
    },
    {
      id: '1FtfIFNAOLa21f5_fO0lMuovrPjvR_7Gr',
      name: 'Ch1 Part 4',
      subject: 'Accounts',
      chapter_no: 'Chapter 1',
      chapter_name: 'Introduction to Accounting',
    },
    {
      id: '1HkXK3-GGs4_JkSxZTUlIC4Gjzh3ZkAm5',
      name: 'Ch1 Part 5',
      subject: 'Accounts',
      chapter_no: 'Chapter 1',
      chapter_name: 'Introduction to Accounting',
    },
    {
      id: '1wfbniMEn0JIbrnjVEVSoPxYWwJz7ebEL',
      name: 'Ch2 Part 1',
      subject: 'Accounts',
      chapter_no: 'Chapter 2',
      chapter_name: 'Theory Base of Accounting',
    },
    {
      id: '1cTnZbLbtfCR7J9NzKIRGscAqgYU3Kudc',
      name: 'Ch2 Part 2',
      subject: 'Accounts',
      chapter_no: 'Chapter 2',
      chapter_name: 'Theory Base of Accounting',
    },
    {
      id: '1LaGjpp13XiIu3gIXxUzyYLfvNjsQbjwP',
      name: 'Ch2 Part 3',
      subject: 'Accounts',
      chapter_no: 'Chapter 2',
      chapter_name: 'Theory Base of Accounting',
    },
    {
      id: '1gwWTInWsoH9uk9FRfvYn349_JUjEQCVz',
      name: 'Ch2 Part 4',
      subject: 'Accounts',
      chapter_no: 'Chapter 2',
      chapter_name: 'Theory Base of Accounting',
    },
    {
      id: '15xZCFOkx3HW15hTH3RQvlzZxAj110rLO',
      name: 'Ch3A Part 1',
      subject: 'Accounts',
      chapter_no: 'Chapter 3A',
      chapter_name: 'Recording of Transactions - I',
    },
    {
      id: '16uhignaSzl3OCqIP6ND7lKPFQbmNbZV_',
      name: 'Ch3A Part 2',
      subject: 'Accounts',
      chapter_no: 'Chapter 3A',
      chapter_name: 'Recording of Transactions - I',
    },
    {
      id: '1DeHNcPUwK9KHXM9Aci0z7uxffdm9i7Rg',
      name: 'Ch3B Part 1',
      subject: 'Accounts',
      chapter_no: 'Chapter 3B',
      chapter_name: 'Recording of Transactions - II',
    },
    {
      id: '1JXBeNCrEdwwUsRRV0TLUKgdnN7btmBUM',
      name: 'Ch3B Part 2',
      subject: 'Accounts',
      chapter_no: 'Chapter 3B',
      chapter_name: 'Recording of Transactions - II',
    },
    {
      id: '1pZkTQY_F-y9nM3_k58BL2Z17y1HqqUpG',
      name: 'Ch4 Part 1',
      subject: 'Accounts',
      chapter_no: 'Chapter 4',
      chapter_name: 'Bank Reconciliation Statement',
    }
  ]
};

const Lectures = ({navigation}) => {
  const {colors, dark} = useTheme();
  const [selectedClass, setSelectedClass] = useState();
  const [topSubjects, setTopSubjects] = useState([]);

  useEffect(() => {
    const loadTopSubjects = async () => {
      try {
        const top = await getTopEngagedSubjects(3);
        setTopSubjects(top);
      } catch (e) {
        console.log('Error loading top subjects in lectures', e);
      }
    };
    loadTopSubjects();
  }, [selectedClass]);

  const handleSelectClass = (clsValue) => {
    setSelectedClass(clsValue);
  };

  const currentLectures = lecturesData[selectedClass] || [];
  const hasSelectedClass = selectedClass !== undefined && selectedClass !== null;

  return (
    <Screen list style={{backgroundColor: colors.background}}>
      {!hasSelectedClass ? (
        // CLASS SELECTION LAYOUT
        <ScrollView contentContainerStyle={{paddingBottom: 40}} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, {backgroundColor: colors.surface}]}>
            <View style={styles.heroLeft}>
              <View style={[styles.heroIconWrapper, {backgroundColor: '#f3e5f5'}]}>
                <Micon name="video-outline" size={28} color="#4a148c" />
              </View>
            </View>
            <View style={styles.heroRight}>
              <Text
                size="medium"
                style={[styles.heroTitle, {color: colors.onSurface}]}>
                Video Lectures 🎥
              </Text>
              <Text
                size="small"
                style={[styles.heroSubtitle, {color: colors.outline}]}>
                High-quality recorded video lectures mapped chapter-wise.
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
                  onPress={() => handleSelectClass(item.value)}
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

                    {/* View Action */}
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10}}>
                      <Text style={{fontWeight: 'bold', fontSize: 12, color: item.borderColor}}>Watch Lectures</Text>
                      <Micon name="chevron-right" size={16} color={item.borderColor} />
                    </View>
                  </View>
                </TouchableRipple>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        // ACTIVE STATE: SHOW LECTURES LIST FOR CLASS
        <View style={{flex: 1, paddingHorizontal: 16, marginTop: 10}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
            <TouchableRipple
              onPress={() => setSelectedClass(undefined)}
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
              Class {selectedClass}th Lectures
            </Text>
          </View>

          {currentLectures.length === 0 ? (
            <View style={styles.centerContainer}>
              <Image
                source={require('../../../Assets/Images/nodata.png')}
                style={styles.noDataImage}
              />
              <Text size="medium" style={{fontWeight: 'bold', color: colors.onSurface, marginTop: 15}}>
                No Lectures Found
              </Text>
              <Text size="small" style={{color: colors.outline, textAlign: 'center', marginTop: 4, paddingHorizontal: 40}}>
                We couldn't find any video lectures for Class {selectedClass}th at this moment. Check back soon!
              </Text>
            </View>
          ) : (
            (() => {
              const recommendedLectures = (currentLectures || []).filter(item => 
                topSubjects.some(sub => (item.subject || '').toLowerCase().includes(sub.toLowerCase()))
              );

              // Reorder lectures: push recommended subjects to the top of the main list!
              const sortedLectures = [...(currentLectures || [])].sort((a, b) => {
                const aIsRec = topSubjects.some(sub => (a.subject || '').toLowerCase().includes(sub.toLowerCase()));
                const bIsRec = topSubjects.some(sub => (b.subject || '').toLowerCase().includes(sub.toLowerCase()));
                if (aIsRec && !bIsRec) return -1;
                if (!aIsRec && bIsRec) return 1;
                return 0;
              });

              return (
                <FlatList
                  data={sortedLectures}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{paddingBottom: 40}}
                  ListHeaderComponent={
                    topSubjects.length > 0 ? (
                      <View style={{marginBottom: 20}}>
                        {recommendedLectures.length > 0 && (
                          <>
                            <Text style={{fontWeight: 'bold', fontSize: 16, color: colors.onSurface, marginBottom: 12}}>
                              ✨ Recommended for You
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12, paddingBottom: 6}}>
                              {recommendedLectures.slice(0, 5).map(item => {
                                const subjectInfo = getSubjectInfo(item.subject);
                                return (
                                  <TouchableRipple
                                    key={`rec-${item.id}`}
                                    onPress={async () => {
                                      await trackEngagement(item.subject || 'General', 'lecture');
                                      await setRecentNote({
                                        name: item.name,
                                        subject: item.subject || 'General',
                                        type: 'lecture',
                                        board: '',
                                        class: selectedClass || '',
                                        subtopic: item.chapter_name || ''
                                      });
                                      navigation.navigate('LecturePlayer', {
                                        lecture: item,
                                      });
                                    }}
                                    style={{
                                      width: 220,
                                      backgroundColor: dark ? colors.surface : '#faf5ff',
                                      borderColor: dark ? colors.outlineVariant : '#8b5cf6',
                                      borderWidth: 1.5,
                                      borderRadius: 16,
                                      padding: 12,
                                      marginRight: 12,
                                      elevation: 1,
                                    }}>
                                    <View>
                                      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                                        <View style={[{backgroundColor: subjectInfo.bg, padding: 6, borderRadius: 8}]}>
                                          <Micon name="video-outline" size={18} color={subjectInfo.color} />
                                        </View>
                                        <View style={{backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6}}>
                                          <Text style={{fontSize: 9, fontWeight: 'bold', color: subjectInfo.color}}>{item.subject}</Text>
                                        </View>
                                      </View>
                                      <Text numberOfLines={2} style={{fontWeight: 'bold', fontSize: 13, color: colors.onSurface, height: 36, lineHeight: 18}}>
                                        {item.name}
                                      </Text>
                                      <Text numberOfLines={1} style={{fontSize: 10, color: colors.outline, marginTop: 6}}>
                                        {item.chapter_name}
                                      </Text>
                                    </View>
                                  </TouchableRipple>
                                );
                              })}
                            </ScrollView>
                          </>
                        )}

                        {/* Cross-section recommendation to Notes */}
                        <TouchableRipple
                          onPress={() => {
                            navigation.navigate('Notes');
                          }}
                          style={{
                            backgroundColor: dark ? 'rgba(0, 113, 113, 0.12)' : '#eefbfb',
                            borderColor: dark ? '#007171' : '#009688',
                            borderWidth: 1.5,
                            borderRadius: 16,
                            padding: 12,
                            marginTop: recommendedLectures.length > 0 ? 16 : 0,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            elevation: 1,
                          }}>
                          <>
                            <View style={{backgroundColor: '#007171', padding: 8, borderRadius: 8}}>
                              <Micon name="file-document-outline" size={20} color="white" />
                            </View>
                            <View style={{flex: 1}}>
                              <Text style={{fontWeight: 'bold', fontSize: 13, color: colors.onSurface}}>
                                📝 Read summary notes!
                              </Text>
                              <Text style={{fontSize: 11, color: colors.outline, marginTop: 2}}>
                                Review textbook summaries and NCERT Solutions for {topSubjects[0].charAt(0).toUpperCase() + topSubjects[0].slice(1)} first.
                              </Text>
                            </View>
                            <Micon name="chevron-right" size={20} color={colors.primary} />
                          </>
                        </TouchableRipple>

                        <View style={{height: 1, backgroundColor: colors.outlineVariant, marginVertical: 15}} />
                      </View>
                    ) : null
                  }
                  renderItem={({item}) => {
                    const subjectInfo = getSubjectInfo(item.subject);
                return (
                  <TouchableRipple
                    onPress={() => {
                      trackEngagement(item.subject || 'General', 'lecture');
                      setRecentNote({
                        name: item.name,
                        subject: item.subject || 'General',
                        type: 'lecture',
                        board: '',
                        class: selectedClass?.label || '',
                        subtopic: item.chapter_name || ''
                      });
                      navigation.navigate('LecturePlayer', {
                        lecture: item,
                      });
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
                          name="video-outline"
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
                          {topSubjects.some(sub => (item.subject || '').toLowerCase().includes(sub.toLowerCase())) && (
                            <View
                              style={{
                                backgroundColor: dark ? 'rgba(76, 175, 80, 0.15)' : '#e8f5e9',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 6,
                                marginLeft: 8,
                                borderWidth: 0.8,
                                borderColor: '#4caf50',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 2,
                              }}>
                              <Micon name="star-face" size={10} color="#4caf50" />
                              <Text style={{fontSize: 9, fontWeight: 'bold', color: '#4caf50'}}>Recommended</Text>
                            </View>
                          )}
                          <Text
                            style={[styles.metaText, {color: colors.outline}]}>
                            Ch: {item.chapter_no}
                          </Text>
                        </View>

                      </View>
                      <View style={styles.cardActionWrapper}>
                        <Micon
                          name="play-circle-outline"
                          size={32}
                          color={subjectInfo.color}
                        />
                      </View>
                    </View>
                  </TouchableRipple>
                );
              }}
            />
            );
          })())}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  noteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardDetails: {
    flex: 1,
  },
  noteName: {
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
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
  },
  metaText: {
    fontSize: 11,
  },
  chapterName: {
    fontSize: 11,
  },
  cardActionWrapper: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
};

export default Lectures;
