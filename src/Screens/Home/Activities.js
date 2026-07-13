import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import {useTheme, Card} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Core UI imports from the project
import Screen from '../../Components/Screen/Screen';
import Text from '../../Components/Input/Text';
import InputText from '../../Components/Input/TextInput';
import Dropdown from '../../Components/Input/Dropdown';
import InputButton from '../../Components/Input/Button';

const {width} = Dimensions.get('window');

const phrases = [
  'Critical Thinking',
  'Problem Solving',
  'Logic Puzzles',
  'Skill Learning',
];

const learnItems = [
  {
    title: 'Critical Thinking',
    img: 'https://www.studifysuccess.com/images/thinking.webp',
  },
  {
    title: 'Problem Solving',
    img: 'https://www.studifysuccess.com/images/idea.webp',
  },
  {
    title: 'Sequencing',
    img: 'https://www.studifysuccess.com/images/prioritize.webp',
  },
  {
    title: 'Logic',
    img: 'https://www.studifysuccess.com/images/logic.webp',
  },
];

const categoriesList = [
  {
    title: 'AI',
    img: 'https://www.studifysuccess.com/images/ac_chatbot.webp',
    url: 'https://activities.studifysuccess.com/classes/ai',
  },
  {
    title: 'Art',
    img: 'https://www.studifysuccess.com/images/ac_paint-palette.webp',
    url: 'https://activities.studifysuccess.com/classes/art',
  },
  {
    title: 'Coding',
    img: 'https://www.studifysuccess.com/images/ac_code.webp',
    url: 'https://activities.studifysuccess.com/classes/coding',
  },
  {
    title: 'Communication',
    img: 'https://www.studifysuccess.com/images/ac_communication.webp',
    url: 'https://activities.studifysuccess.com/classes/communication',
  },
  {
    title: 'Computer',
    img: 'https://www.studifysuccess.com/images/computer.webp',
    url: 'https://activities.studifysuccess.com/classes/computer',
  },
  {
    title: 'Cyber Security',
    img: 'https://www.studifysuccess.com/images/cyber-criminal.webp',
    url: 'https://activities.studifysuccess.com/classes/cyber-security',
  },
  {
    title: 'Debate',
    img: 'https://www.studifysuccess.com/images/ac_debate.webp',
    url: 'https://activities.studifysuccess.com/classes/debate',
  },
  {
    title: 'English Speak',
    img: 'https://www.studifysuccess.com/images/ac_speak.webp',
    url: 'https://activities.studifysuccess.com/classes/english-speaking',
  },
  {
    title: 'Entrepreneur',
    img: 'https://www.studifysuccess.com/images/act-start-up.webp',
    url: 'https://activities.studifysuccess.com/classes/entrepreneurship',
  },
  {
    title: 'Financial Found',
    img: 'https://www.studifysuccess.com/images/act-evaluation.webp',
    url: 'https://activities.studifysuccess.com/classes/financial-foundation',
  },
  {
    title: 'French',
    img: 'https://www.studifysuccess.com/images/act-french.webp',
    url: 'https://activities.studifysuccess.com/classes/french',
  },
  {
    title: 'German',
    img: 'https://www.studifysuccess.com/images/act-language.webp',
    url: 'https://activities.studifysuccess.com/classes/german',
  },
  {
    title: 'Hindi Speak',
    img: 'https://www.studifysuccess.com/images/ac_hindi.webp',
    url: 'https://activities.studifysuccess.com/classes/hindi-speaking',
  },
  {
    title: 'Leadership',
    img: 'https://www.studifysuccess.com/images/ac_leadership.webp',
    url: 'https://activities.studifysuccess.com/classes/leadership',
  },
  {
    title: 'Maths',
    img: 'https://www.studifysuccess.com/images/ac_think.webp',
    url: 'https://activities.studifysuccess.com/classes/maths',
  },
  {
    title: 'Personality Dev',
    img: 'https://www.studifysuccess.com/images/act-team-leader.webp',
    url: 'https://activities.studifysuccess.com/classes/personality-dev',
  },
  {
    title: 'Research Innov',
    img: 'https://www.studifysuccess.com/images/act-research-and-development.webp',
    url: 'https://activities.studifysuccess.com/classes/research-innovation',
  },
  {
    title: 'Robotics',
    img: 'https://www.studifysuccess.com/images/act-ai.webp',
    url: 'https://activities.studifysuccess.com/classes/robotics',
  },
  {
    title: 'Science',
    img: 'https://www.studifysuccess.com/images/ac_scientist.webp',
    url: 'https://activities.studifysuccess.com/classes/science',
  },
  {
    title: 'Writing Skills',
    img: 'https://www.studifysuccess.com/images/ac_etter.webp',
    url: 'https://activities.studifysuccess.com/classes/writing',
  },
];

const activityList = [
  {label: 'AI', value: 'AI'},
  {label: 'Art', value: 'Art'},
  {label: 'Coding', value: 'Coding'},
  {label: 'Communication', value: 'Communication'},
  {label: 'Computer', value: 'Computer'},
  {label: 'Cyber Security', value: 'Cyber Security'},
  {label: 'Debate', value: 'Debate'},
  {label: 'English Speaking', value: 'English Speaking'},
  {label: 'Entrepreneur', value: 'Entrepreneur'},
  {label: 'Financial Foundation', value: 'Financial Foundation'},
  {label: 'French', value: 'French'},
  {label: 'German', value: 'German'},
  {label: 'Hindi Speaking', value: 'Hindi Speaking'},
  {label: 'Leadership', value: 'Leadership'},
  {label: 'Maths', value: 'Maths'},
  {label: 'Personality Dev', value: 'Personality Dev'},
  {label: 'Research Innovation', value: 'Research Innovation'},
  {label: 'Robotics', value: 'Robotics'},
  {label: 'Science', value: 'Science'},
  {label: 'Writing', value: 'Writing'},
];

const stateList = [
  {label: 'Delhi', value: 'Delhi'},
  {label: 'Uttar Pradesh', value: 'Uttar Pradesh'},
  {label: 'Haryana', value: 'Haryana'},
  {label: 'Rajasthan', value: 'Rajasthan'},
  {label: 'Bihar', value: 'Bihar'},
  {label: 'Madhya Pradesh', value: 'Madhya Pradesh'},
  {label: 'Maharashtra', value: 'Maharashtra'},
  {label: 'Uttarakhand', value: 'Uttarakhand'},
  {label: 'Punjab', value: 'Punjab'},
  {label: 'West Bengal', value: 'West Bengal'},
  {label: 'Andhra Pradesh', value: 'Andhra Pradesh'},
  {label: 'Karnataka', value: 'Karnataka'},
  {label: 'Tamil Nadu', value: 'Tamil Nadu'},
  {label: 'Gujarat', value: 'Gujarat'},
  {label: 'Other', value: 'Other'},
];

const Activities = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const scrollViewRef = useRef(null);
  const categoriesGridRef = useRef(null);
  const demoFormRef = useRef(null);
  const [categoriesYPosition, setCategoriesYPosition] = useState(0);
  const [demoYPosition, setDemoYPosition] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const [form, setForm] = useState({
    fname: '',
    email: '',
    mobile: '',
    activity: '',
    state: '',
  });

  const updateFormValue = ({name, value}) => {
    setForm(prev => ({...prev, [name]: value}));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const openLink = (url, title = 'Web Page') => {
    if (!url) {
      return;
    }
    if (
      url.startsWith('tel:') ||
      url.startsWith('https://wa.me') ||
      url.startsWith('https://whatsapp.com') ||
      url.startsWith('https://api.whatsapp.com')
    ) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open redirection link');
      });
    } else {
      navigation.navigate('WebView', {url, title});
    }
  };

  const scrollToCategories = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: categoriesYPosition, animated: true});
    }
  };

  const scrollToDemo = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: demoYPosition, animated: true});
    }
  };

  const handleBookingSubmit = () => {
    const {fname, email, mobile, activity, state} = form;
    if (!fname || !mobile || !activity) {
      Alert.alert(
        'Error',
        'Please fill Your Name, Phone Number, and select an Activity.',
      );
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit Phone Number.');
      return;
    }

    const message = `Hi Studifysuccess! I want to book a Demo Class for Activities.\n\nHere are my details:\n👤 Name: ${fname}\n📧 Email: ${
      email || 'Not Provided'
    }\n📞 Phone: ${mobile}\n🎯 Activity: ${activity}\n📍 State: ${
      state || 'Not Provided'
    }\n\nPlease confirm my demo slot. Thanks!`;
    const whatsappUrl = `https://wa.me/918447186881?text=${encodeURIComponent(
      message,
    )}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert(
        'Error',
        'WhatsApp not found. Contact +91 8447186881 directly.',
      );
    });
  };

  const handleReferAndEarn = () => {
    const message =
      'Hello Studifysuccess! I want to know more about the Refer & Earn program on Activities.';
    const whatsappUrl = `https://wa.me/918447186881?text=${encodeURIComponent(
      message,
    )}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert(
        'Error',
        'WhatsApp not found. Contact +91 8447186881 directly.',
      );
    });
  };

  return (
    <Screen
      padding={false}
      NoHeader={false}
      list={true}
      style={{backgroundColor: colors.background}}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{flexGrow: 1}}
        nestedScrollEnabled
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        {/* 1. HERO BANNER */}
        <Card style={[styles.heroCard, {backgroundColor: colors.surface}]}>
          <View style={styles.heroRow}>
            {/* Left Content */}
            <View style={styles.heroLeft}>
              <Text
                size="small"
                style={[styles.heroHindiTagline, {color: colors.primary}]}>
                सिर्फ किताबों से नहीं होगी कहानी पूरी, पढ़ाई के साथ Skills भी
                हैं ज़रूरी।
              </Text>

              <Text
                size="medium"
                style={[styles.typingText, {color: colors.outline}]}>
                Learn:{' '}
                <Text
                  size="medium"
                  style={{fontWeight: 'bold', color: colors.primary}}>
                  {phrases[phraseIndex]}
                </Text>
              </Text>

              <View style={styles.heroBtnRow}>
                <TouchableOpacity
                  onPress={scrollToCategories}
                  style={[
                    styles.heroPillBtn,
                    {backgroundColor: colors.primary},
                  ]}>
                  <Text size="small" style={styles.heroBtnText}>
                    Explore All ❯
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={scrollToDemo}
                  style={[styles.heroPillBtn, {backgroundColor: '#3b82f6'}]}>
                  <Text size="small" style={styles.heroBtnText}>
                    Demo ❯
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Side Illustration */}
            <View style={styles.heroRight}>
              <View style={[styles.pinkCircle, {backgroundColor: '#ffdcdb'}]} />
              <Image
                source={{
                  uri: 'https://www.studifysuccess.com/images/3d-casual-life-young-people-students-1.webp',
                }}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </Card>

        <View style={styles.content}>
          {/* 2. SERVICES GRID: WHAT STUDENTS WILL LEARN */}
          <View style={styles.sectionHeaderRow}>
            <Text
              size="medium"
              style={[styles.sectionTitle, {color: colors.primary}]}>
              Students Will Learn
            </Text>
          </View>

          <View style={styles.learnGrid}>
            {learnItems.map((item, idx) => (
              <View
                key={idx}
                style={[styles.learnCard, {backgroundColor: colors.surface}]}>
                <Image
                  source={{uri: item.img}}
                  style={styles.learnIcon}
                  resizeMode="contain"
                />
                <Text
                  size="small"
                  style={[styles.learnLabel, {color: colors.onSurface}]}>
                  {item.title}
                </Text>
              </View>
            ))}
          </View>

          {/* 3. REFER & EARN BANNER */}
          <TouchableOpacity onPress={handleReferAndEarn}>
            <Card style={styles.referCard}>
              <View style={styles.referBody}>
                <Text size="medium" style={styles.referTitle}>
                  💰 Refer & Earn
                </Text>
                <Text size="small" style={styles.referText}>
                  Earn up to{' '}
                  <Text size="small" style={styles.referHighlight}>
                    ₹1000
                  </Text>{' '}
                  by inviting friends who purchase a course!
                </Text>
                <View style={styles.referRulesRow}>
                  <View style={styles.referRuleBox}>
                    <Text size="small" style={styles.referRuleLabel}>
                      1 Refer
                    </Text>
                    <View style={styles.badgeWarning}>
                      <Text size="small" style={styles.badgeTextWarning}>
                        ₹10
                      </Text>
                    </View>
                  </View>
                  <View style={styles.referRuleBox}>
                    <Text size="small" style={styles.referRuleLabel}>
                      100 Refers
                    </Text>
                    <View style={styles.badgeWarning}>
                      <Text size="small" style={styles.badgeTextWarning}>
                        ₹1000
                      </Text>
                    </View>
                  </View>
                </View>
                <Text size="small" style={styles.referTnc}>
                  * Reward is only applicable when the referred student
                  purchases a course.
                </Text>
                <View style={styles.referBtn}>
                  <Text size="small" style={styles.referBtnText}>
                    Start Earning 🚀
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>

          {/* 4. EXPLORE ALL ACTIVITIES GRID */}
          <View
            ref={categoriesGridRef}
            onLayout={event => {
              const layout = event.nativeEvent.layout;
              setCategoriesYPosition(layout.y);
            }}>
            <View style={styles.sectionHeaderRow}>
              <Text
                size="medium"
                style={[styles.sectionTitle, {color: colors.primary}]}>
                Our Activities
              </Text>
            </View>

            <View style={styles.categoryGrid}>
              {categoriesList.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => openLink(item.url, item.title)}
                  style={[
                    styles.categoryItem,
                    {backgroundColor: colors.surface},
                  ]}>
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{uri: item.img}}
                      style={styles.categoryImg}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    size="small"
                    numberOfLines={2}
                    style={[styles.categoryLabel, {color: colors.onSurface}]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 5. NATIVE DEMO BOOKING FORM */}
          <View
            ref={demoFormRef}
            onLayout={event => {
              const layout = event.nativeEvent.layout;
              setDemoYPosition(layout.y);
            }}>
            <Card style={[styles.formCard, {backgroundColor: colors.surface}]}>
              <Text
                size="medium"
                style={[styles.formTitle, {color: colors.primary}]}>
                Book A Demo Class
              </Text>
              <Text
                size="small"
                style={{
                  color: colors.outline,
                  textAlign: 'center',
                  marginBottom: 15,
                  fontSize: 12,
                }}>
                Unlock new skills • Fill the details below
              </Text>

              <Dropdown
                label="Select Activity *"
                name="activity"
                value={form.activity}
                updateFormValue={updateFormValue}
                list={activityList}
              />
              <View style={{height: 5}} />

              <InputText
                label="Your Name *"
                name="fname"
                value={form.fname}
                updateFormValue={updateFormValue}
              />

              <InputText
                label="Your Email"
                name="email"
                value={form.email}
                updateFormValue={updateFormValue}
                keyboard="email-address"
              />

              <InputText
                label="Your Phone (10 digits) *"
                name="mobile"
                value={form.mobile}
                updateFormValue={updateFormValue}
                keyboard="numeric"
                maxLength={10}
              />

              <Dropdown
                label="Select State"
                name="state"
                value={form.state}
                updateFormValue={updateFormValue}
                list={stateList}
              />
              <View style={{height: 10}} />

              <InputButton
                name="Book Now ❯"
                onPress={handleBookingSubmit}
                style={{marginTop: 10, height: 48, borderRadius: 24}}
              />

              <View style={styles.querySection}>
                <Text
                  size="small"
                  style={{
                    color: colors.outline,
                    fontSize: 11.5,
                    marginBottom: 5,
                  }}>
                  Any Queries? Connect with us on WhatsApp
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    openLink(
                      'https://wa.me/918447186881?text=Hello%20Studifysuccess!%20I%20have%20queries%20regarding%20student%20activities.',
                      'Queries',
                    )
                  }
                  style={[styles.waQueryBtn, {backgroundColor: '#25D366'}]}>
                  <Icon name="whatsapp" size={16} color="#fff" />
                  <Text size="small" style={styles.waQueryText}>
                    {' '}
                    +91-8447186881
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        </View>
        <View style={{height: 35}} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 15,
  },
  heroCard: {
    margin: 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 180,
  },
  heroLeft: {
    flex: 0.6,
    padding: 15,
    justifyContent: 'space-between',
  },
  heroHindiTagline: {
    fontWeight: 'bold',
    fontSize: 13,
    lineHeight: 18,
  },
  typingText: {
    fontSize: 14,
    marginTop: 8,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  heroPillBtn: {
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroRight: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pinkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'absolute',
    alignSelf: 'center',
  },
  heroImage: {
    width: 100,
    height: 120,
    zIndex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  learnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 15,
  },
  learnCard: {
    width: (width - 75) / 2,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaeaea',
    elevation: 1,
  },
  learnIcon: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  learnLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  referCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 15,
    elevation: 3,
    backgroundColor: '#fb9c9a',
  },
  referBody: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 139, 139, 0.85)',
  },
  referTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 6,
  },
  referText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  referHighlight: {
    fontWeight: 'bold',
    color: '#ffeb3b',
  },
  referRulesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  referRuleBox: {
    alignItems: 'center',
  },
  referRuleLabel: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 4,
  },
  badgeWarning: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTextWarning: {
    color: '#008b8b',
    fontWeight: 'bold',
    fontSize: 12,
  },
  referTnc: {
    color: '#e0f2f1',
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  referBtn: {
    backgroundColor: '#ffeb3b',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    elevation: 2,
  },
  referBtnText: {
    color: '#008b8b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 15,
  },
  categoryItem: {
    width: (width - 75) / 2,
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaeaea',
    elevation: 1,
    marginVertical: 4,
  },
  imageWrapper: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  categoryImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  categoryLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  formCard: {
    borderRadius: 16,
    padding: 15,
    elevation: 2,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  formTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  querySection: {
    alignItems: 'center',
    marginTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: '#eaeaea',
    paddingTop: 12,
  },
  waQueryBtn: {
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waQueryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
});

export default Activities;
