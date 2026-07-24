import {useState, useRef, useEffect} from 'react';
import {Screen, Swiper} from '../../Components/Screen';
import {Searchbar, ActivityIndicator, TouchableRipple, useTheme} from 'react-native-paper';
import useApi from '../../Components/Api/Api';
import {View, ScrollView, Image, StyleSheet} from 'react-native';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text} from '../../Components/Input';
import {getTopEngagedSubjects, getRecentNote, openRecentItem} from '../../Utils/EngagementTracker';
import {formatSubjectForBoard} from '../../Utils/CurriculumConfig';


const getSubjectInfo = (subject) => {
  const s = subject?.toLowerCase() || '';
  if (s.includes('math')) return { icon: 'calculator', color: '#673ab7', bg: '#ede7f6' };
  if (s.includes('sci') || s.includes('physic') || s.includes('chemist') || s.includes('bio')) return { icon: 'flask-outline', color: '#009688', bg: '#e0f2f1' };
  if (s.includes('english')) return { icon: 'translate', color: '#3f51b5', bg: '#e8eaf6' };
  if (s.includes('social') || s.includes('history') || s.includes('geography') || s.includes('civics')) return { icon: 'earth', color: '#e65100', bg: '#fff3e0' };
  return { icon: 'file-document-outline', color: '#007171', bg: '#e0f2f2' };
};

const Search = ({navigation}) => {
  const [value, setValue] = useState('');
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedSubjects, setSuggestedSubjects] = useState([]);
  const [recentNote, setRecentNoteState] = useState(null);
  const ref = useRef();

  const {get} = useApi();
  const {colors} = useTheme();

  useEffect(() => {
    setTimeout(() => {
      ref.current?.focus();
    }, 100);

    const loadSuggestions = async () => {
      try {
        const top = await getTopEngagedSubjects(3);
        setSuggestedSubjects(top);
        const recent = await getRecentNote();
        setRecentNoteState(recent);
      } catch (e) {
        console.log('Error loading search suggestions', e);
      }
    };
    loadSuggestions();
  }, []);


  const fetchData = async () => {
    if (!value.trim()) {
      setCourses([]);
      setNotes([]);
      return;
    }
    setLoading(true);
    try {
      const data = await get(`/course/search/${value}`);
      setCourses(data?.data?.courses || []);
      setNotes(data?.data?.notes || []);
    } catch (err) {
      console.log('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(fetchData, 500);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const hasNoResults = courses.length === 0 && notes.length === 0;

  return (
    <Screen list NoHeader style={{backgroundColor: colors.background}}>
      <Searchbar
        ref={ref}
        icon={'arrow-left'}
        onIconPress={() => navigation.goBack()}
        placeholder="Search courses or study notes..."
        value={value}
        onChangeText={e => setValue(e)}
        style={{marginHorizontal: 4, marginTop: 4}}
      />

      {loading && value ? (
        <ActivityIndicator size={30} style={{marginTop: 20}} />
      ) : hasNoResults && value ? (
        <Image
          source={require('../../Assets/Images/nodata2.png')}
          style={{
            width: 250,
            height: 250,
            alignSelf: 'center',
            marginTop: 100,
          }}
        />
      ) : (
        <ScrollView style={{marginVertical: 10, paddingHorizontal: 12}} contentContainerStyle={{paddingBottom: 40}}>
          {!value && (
            <View style={{ marginBottom: 20 }}>
              {/* Recent study note card */}
              {recentNote && (
                <View style={{ marginBottom: 20 }}>
                  <Text size="medium" style={{ fontWeight: 'bold', marginBottom: 10, color: colors.onSurface }}>
                    Recently Studied 🕒
                  </Text>
                  <TouchableRipple
                    onPress={() => openRecentItem(navigation, recentNote)}
                    style={[
                      styles.noteCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={styles.cardRow}>
                      <View style={[styles.iconBadge, { backgroundColor: '#ffebee' }]}>
                        <Micon name={recentNote.type === 'note' ? 'file-pdf-box' : 'play-circle'} size={24} color="#e53935" />
                      </View>
                      <View style={styles.cardDetails}>
                        <Text size="medium" numberOfLines={1} style={[styles.noteName, { color: colors.onSurface }]}>
                          {recentNote.name}
                        </Text>
                        <Text size="small" style={{ color: colors.outline, textTransform: 'capitalize' }}>
                          Subject: {formatSubjectForBoard(recentNote.subject, recentNote.board)} • {recentNote.type}
                        </Text>
                      </View>
                      <Micon name="chevron-right" size={24} color={colors.primary} />
                    </View>
                  </TouchableRipple>
                </View>
              )}

              {/* Recommended subject shortcut tags */}
              {suggestedSubjects.length > 0 && (
                <View>
                  <Text size="medium" style={{ fontWeight: 'bold', marginBottom: 10, color: colors.onSurface }}>
                    Suggested Subjects 💡
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {suggestedSubjects.map(subj => (
                      <TouchableRipple
                        key={subj}
                        onPress={() => setValue(subj)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: colors.surfaceVariant,
                          borderWidth: 1,
                          borderColor: colors.outlineVariant
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary, textTransform: 'capitalize' }}>
                          {subj}
                        </Text>
                      </TouchableRipple>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {courses.length > 0 && (

            <View style={{marginBottom: 20}}>
              <Text size="large" style={{fontWeight: 'bold', marginBottom: 12, color: colors.onSurface}}>
                Courses 🎓
              </Text>
              {courses.map(item => (
                <Swiper key={item.course_id.toString()} data={item} />
              ))}
            </View>
          )}

          {notes.length > 0 && (
            <View>
              <Text size="large" style={{fontWeight: 'bold', marginBottom: 12, color: colors.onSurface}}>
                Study Notes & PDFs 📝
              </Text>
              {notes.map(item => {
                const subjectInfo = getSubjectInfo(item.subject);
                return (
                  <TouchableRipple
                    key={item.id.toString()}
                    onPress={() => {
                      navigation.navigate('Pdf', {
                        url: item.pdf_url,
                        title: item.title || 'Note',
                        subject: item.subject || 'General',
                        studentClass: item.class || item.studentClass || item.cls || item.form
                      });
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
              })}
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
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
});

export default Search;
