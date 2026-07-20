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
  'Expert Mentors',
  'Smart Classrooms',
  'Weekly Mock Tests',
  'Personal Doubt Support',
];

const OfflineTuitions = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const scrollViewRef = useRef(null);
  const formCardRef = useRef(null);
  const [formYPosition, setFormYPosition] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Collapsible FAQs state
  const [expandedSection, setExpandedSection] = useState({
    faqs: false,
  });

  const toggleSection = section => {
    setExpandedSection(prev => ({...prev, [section]: !prev[section]}));
  };

  // Form State for Pre-Registration
  const [form, setForm] = useState({
    fname: '',
    email: '',
    mobile: '',
    gender: '',
    class_st: '',
    state: '',
    interest: '',
  });

  const updateFormValue = ({name, value}) => {
    setForm(prev => ({...prev, [name]: value}));
  };

  // Dropdown lists
  const genderList = [
    {label: 'Male', value: 'Male'},
    {label: 'Female', value: 'Female'},
    {label: 'Others', value: 'Others'},
  ];

  const classList = [
    {label: 'Class 1st', value: 'Class 1st'},
    {label: 'Class 2nd', value: 'Class 2nd'},
    {label: 'Class 3rd', value: 'Class 3rd'},
    {label: 'Class 4th', value: 'Class 4th'},
    {label: 'Class 5th', value: 'Class 5th'},
    {label: 'Class 6th', value: 'Class 6th'},
    {label: 'Class 7th', value: 'Class 7th'},
    {label: 'Class 8th', value: 'Class 8th'},
    {label: 'Class 9th', value: 'Class 9th'},
    {label: 'Class 10th', value: 'Class 10th'},
    {label: 'Class 11th', value: 'Class 11th'},
    {label: 'Class 12th', value: 'Class 12th'},
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

  const interestList = [
    {label: 'Offline Tuition', value: 'Offline Tuition'},
    {label: 'Online Tuition', value: 'Online Tuition'},
  ];

  // FAQ States
  const [faqExpanded, setFaqExpanded] = useState({
    faq1: false,
    faq2: false,
    faq3: false,
    faq4: false,
  });

  const toggleFaq = id => {
    setFaqExpanded(prev => ({...prev, [id]: !prev[id]}));
  };

  // Redirection Link Helper
  const openLink = (url, title = 'Web Page') => {
    if (!url) {
      return;
    }
    if (
      url.startsWith('tel:') ||
      url.startsWith('https://wa.me') ||
      url.startsWith('https://whatsapp.com') ||
      url.startsWith('https://api.whatsapp.com') ||
      url.startsWith('https://maps.app.goo.gl') ||
      url.startsWith('https://www.google.com/maps')
    ) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open redirection link');
      });
    } else {
      navigation.navigate('WebView', {url, title});
    }
  };

  // WhatsApp Pre-Registration Submission
  const handleRegistrationSubmit = () => {
    const {fname, email, mobile, gender, class_st, state, interest} = form;
    if (!fname || !mobile || !class_st) {
      Alert.alert('Error', 'Please fill Your Name, Phone Number, and Class.');
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit Phone Number.');
      return;
    }

    const message = `Hi Studifysuccess! I want to pre-register for Offline Tuition.\n\nHere are my details:\n👤 Name: ${fname}\n📧 Email: ${
      email || 'Not Provided'
    }\n📞 Phone: ${mobile}\n🚻 Gender: ${
      gender || 'Not Provided'
    }\n🎓 Class: ${class_st}\n📍 State: ${
      state || 'Not Provided'
    }\n💡 Interest: ${
      interest || 'Offline Tuition'
    }\n\nPlease confirm my registration slot. Thanks!`;
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

  // Scroll to booking form handler
  const scrollToForm = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: formYPosition, animated: true});
    }
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
        {/* 1. RECREATED 3D HERO BANNER */}
        <Card style={[styles.heroCard, {backgroundColor: colors.surface}]}>
          <View style={styles.heroRow}>
            {/* Left Content */}
            <View style={styles.heroLeft}>
              <Text
                size="medium"
                style={[styles.heroHindiText, {color: colors.onSurface}]}>
                गुरु के सानिध्य में जब होगी ऑफलाइन पढ़ाई, सफलता चूमेगी कदम आपकी
                बढ़ाई।
              </Text>
              <Text
                size="large"
                style={[styles.heroSlogan, {color: colors.primary}]}>
                Offline Tuitions
              </Text>

              <Text
                size="small"
                style={[styles.typingText, {color: colors.outline}]}>
                Learn with:{' '}
                <Text
                  size="small"
                  style={{fontWeight: 'bold', color: colors.primary}}>
                  {phrases[phraseIndex]}
                </Text>
              </Text>

              <View style={styles.heroBtnRow}>
                <TouchableOpacity
                  onPress={() => openLink('tel:+918447186881')}
                  style={[styles.heroPillBtn, {backgroundColor: '#0f8a85'}]}>
                  <Icon name="phone" size={12} color="#fff" />
                  <Text size="small" style={styles.heroBtnText}>
                    {' '}
                    Call Now
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={scrollToForm}
                  style={[styles.heroPillBtn, {backgroundColor: '#3b82f6'}]}>
                  <Text size="small" style={styles.heroBtnText}>
                    Get Started ❯
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Illustration */}
            <View style={styles.heroRight}>
              <View style={[styles.pinkCircle, {backgroundColor: '#ffdcdb'}]} />
              <Image
                source={{
                  uri: 'https://www.studifysuccess.com/images/3d-casual-life-team-of-four-people-discussing-team-project.webp',
                }}
                style={styles.hero3dImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </Card>

        <View style={styles.content}>
          {/* 2. CENTER LOCATION CARD */}
          <Card
            style={[styles.locationCard, {backgroundColor: colors.surface}]}>
            <View style={styles.locationHeader}>
              <Icon name="map-marker-radius" size={24} color={colors.primary} />
              <Text
                size="medium"
                style={[styles.locationTitle, {color: colors.onSurface}]}>
                Laxmi Nagar Center Address
              </Text>
            </View>
            <Text
              size="small"
              style={[styles.locationText, {color: colors.onSurfaceVariant}]}>
              📍 H-23, Vikas Marg, New Metro Pillar No.-34-35, Sai Baba Mandir,
              Laxmi Nagar, New Delhi-110092
            </Text>

            <TouchableOpacity
              onPress={() =>
                openLink(
                  'https://www.google.com/maps/search/?api=1&query=H-23,+Vikas+Marg,+New+Metro+Pillar+No.-34-35,+Sai+Baba+Mandir,+Laxmi+Nagar,+New+Delhi-110092',
                  'Center Location',
                )
              }
              style={[styles.directionBtn, {backgroundColor: colors.primary}]}>
              <Icon name="google-maps" size={16} color="#fff" />
              <Text size="small" style={styles.directionBtnText}>
                Get Directions on Maps
              </Text>
            </TouchableOpacity>
          </Card>

          {/* 3. KEY FEATURES CHIPS */}
          <View style={styles.sectionHeaderRow}>
            <Text
              size="medium"
              style={[styles.sectionTitle, {color: colors.primary}]}>
              Why Choose StudifySuccess Offline?
            </Text>
          </View>

          <View style={styles.featureGrid}>
            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <View style={[styles.iconCircle, {backgroundColor: '#e3f2fd'}]}>
                <Icon
                  name="account-supervisor-circle"
                  size={24}
                  color="#1565c0"
                />
              </View>
              <Text
                size="small"
                style={[styles.featureTitle, {color: colors.onSurface}]}>
                Face-to-Face Mentors
              </Text>
              <Text
                size="small"
                style={[styles.featureDesc, {color: colors.outline}]}>
                Direct interaction & regular physical guidance
              </Text>
            </View>

            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <View style={[styles.iconCircle, {backgroundColor: '#fce4ec'}]}>
                <Icon
                  name="file-document-edit-outline"
                  size={24}
                  color="#c2185b"
                />
              </View>
              <Text
                size="small"
                style={[styles.featureTitle, {color: colors.onSurface}]}>
                Weekly Mock Tests
              </Text>
              <Text
                size="small"
                style={[styles.featureDesc, {color: colors.outline}]}>
                Regular offline examinations to assess performance
              </Text>
            </View>

            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <View style={[styles.iconCircle, {backgroundColor: '#e8f5e9'}]}>
                <Icon name="google-classroom" size={24} color="#2e7d32" />
              </View>
              <Text
                size="small"
                style={[styles.featureTitle, {color: colors.onSurface}]}>
                Smart Infrastructure
              </Text>
              <Text
                size="small"
                style={[styles.featureDesc, {color: colors.outline}]}>
                Comfortable, well-equipped classrooms for focus
              </Text>
            </View>

            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <View style={[styles.iconCircle, {backgroundColor: '#f3e5f5'}]}>
                <Icon name="chat-question-outline" size={24} color="#7b1fa2" />
              </View>
              <Text
                size="small"
                style={[styles.featureTitle, {color: colors.onSurface}]}>
                Doubt Support
              </Text>
              <Text
                size="small"
                style={[styles.featureDesc, {color: colors.outline}]}>
                Dedicated doubt rooms to resolve concepts immediately
              </Text>
            </View>
          </View>

          {/* 4. WHATSAPP CHANNEL SECTION */}
          <Card style={[styles.channelCard, {backgroundColor: '#eafaf1'}]}>
            <View style={styles.channelRow}>
              <Image
                source={{uri: 'https://www.studifysuccess.com/images/oc.webp'}}
                style={styles.channelImage}
                resizeMode="contain"
              />
              <View style={styles.channelInfo}>
                <Text
                  size="medium"
                  style={{fontWeight: 'bold', color: '#1b5e20'}}>
                  Join Offline Updates Channel
                </Text>
                <Text
                  size="small"
                  style={{color: '#2e7d32', fontSize: 11, marginVertical: 3}}>
                  Get direct updates, schedules, batch timings and special
                  revision handouts on WhatsApp.
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    openLink(
                      'https://whatsapp.com/channel/0029VbApuJzGJP8EJDRoLo1P',
                      'WhatsApp Channel',
                    )
                  }
                  style={styles.channelBtn}>
                  <Icon name="whatsapp" size={16} color="#fff" />
                  <Text size="small" style={styles.channelBtnText}>
                    {' '}
                    Join Channel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* 5. NATIVE BOOKING FORM */}
          <View
            ref={formCardRef}
            onLayout={event => {
              const layout = event.nativeEvent.layout;
              setFormYPosition(layout.y);
            }}>
            <Card style={[styles.formCard, {backgroundColor: colors.surface}]}>
              <Text
                size="medium"
                style={[styles.formTitle, {color: colors.primary}]}>
                📝 Pre-Register & Book Your Seat
              </Text>
              <Text
                size="small"
                style={{
                  color: colors.outline,
                  textAlign: 'center',
                  marginBottom: 15,
                  fontSize: 12,
                }}>
                Session (2026-27) • Fill the details below
              </Text>

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
                label="Gender"
                name="gender"
                value={form.gender}
                updateFormValue={updateFormValue}
                list={genderList}
              />
              <View style={{height: 5}} />

              <Dropdown
                label="Select Class *"
                name="class_st"
                value={form.class_st}
                updateFormValue={updateFormValue}
                list={classList}
              />
              <View style={{height: 5}} />

              <Dropdown
                label="Select State"
                name="state"
                value={form.state}
                updateFormValue={updateFormValue}
                list={stateList}
              />
              <View style={{height: 5}} />

              <Dropdown
                label="Your Interest"
                name="interest"
                value={form.interest}
                updateFormValue={updateFormValue}
                list={interestList}
              />
              <View style={{height: 10}} />

              <InputButton
                name="Register via WhatsApp ❯"
                onPress={handleRegistrationSubmit}
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
                  Have questions? Connect directly with us
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    openLink(
                      'https://wa.me/918447186881?text=Hello%20Studifysuccess!%20I%20have%20questions%20regarding%20offline%20tuitions.',
                      'Queries',
                    )
                  }
                  style={[styles.waQueryBtn, {backgroundColor: '#25D366'}]}>
                  <Icon name="whatsapp" size={16} color="#fff" />
                  <Text size="small" style={styles.waQueryText}>
                    {' '}
                    Chat with Helpline
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>

          {/* 6. #1 LEARNING PLATFORM DECORATIVE BRANDING ROW */}
          <View style={[styles.brandingRow, {backgroundColor: colors.surface}]}>
            <Image
              source={{
                uri: 'https://www.studifysuccess.com/images/3d-casual-life-colleagues-discussing-team-project.webp',
              }}
              style={styles.brandingImage}
              resizeMode="contain"
            />
            <View style={styles.brandingText}>
              <Text
                size="medium"
                style={{fontWeight: 'bold', color: colors.primary}}>
                #1 Learning Platform
              </Text>
              <Text
                size="small"
                style={{
                  color: colors.onSurfaceVariant,
                  fontSize: 11,
                  lineHeight: 16,
                  marginTop: 4,
                }}>
                The leading educational ecosystem in India, offering
                comprehensive resources, mentorship programs, and unmatched
                results for middle and high-school board success.
              </Text>
            </View>
          </View>

          {/* 7. FAQs COLLAPSIBLE ACCORDION */}
          <TouchableOpacity
            onPress={() => toggleSection('faqs')}
            style={[
              styles.accordionHeader,
              {backgroundColor: colors.surface, marginTop: 15},
            ]}>
            <View style={styles.accordionHeaderLeft}>
              <Icon
                name="help-circle-outline"
                size={22}
                color={colors.primary}
              />
              <Text
                size="medium"
                style={[styles.accordionTitle, {color: colors.onSurface}]}>
                ❓ Frequently Asked Questions
              </Text>
            </View>
            <Icon
              name={expandedSection.faqs ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.outline}
            />
          </TouchableOpacity>

          {expandedSection.faqs && (
            <View
              style={[styles.accordionBody, {backgroundColor: colors.surface}]}>
              {/* Q1 */}
              <TouchableOpacity
                onPress={() => toggleFaq('faq1')}
                style={styles.faqRow}>
                <View style={styles.faqHeaderRow}>
                  <Text size="small" style={styles.faqQuestion}>
                    Where is the offline tuition center located?
                  </Text>
                  <Icon
                    name={faqExpanded.faq1 ? 'minus' : 'plus'}
                    size={16}
                    color={colors.outline}
                  />
                </View>
                {faqExpanded.faq1 && (
                  <Text size="small" style={styles.faqAnswer}>
                    Our physical center is located at H-23, Vikas Marg, Laxmi
                    Nagar, New Delhi-110092 (Near Metro Pillar No. 34-35 and Sai
                    Baba Mandir).
                  </Text>
                )}
              </TouchableOpacity>

              {/* Q2 */}
              <TouchableOpacity
                onPress={() => toggleFaq('faq2')}
                style={styles.faqRow}>
                <View style={styles.faqHeaderRow}>
                  <Text size="small" style={styles.faqQuestion}>
                    Which classes are taught offline?
                  </Text>
                  <Icon
                    name={faqExpanded.faq2 ? 'minus' : 'plus'}
                    size={16}
                    color={colors.outline}
                  />
                </View>
                {faqExpanded.faq2 && (
                  <Text size="small" style={styles.faqAnswer}>
                    We offer expert offline coaching classes for student batches
                    from Grade 6th up to Grade 12th.
                  </Text>
                )}
              </TouchableOpacity>

              {/* Q3 */}
              <TouchableOpacity
                onPress={() => toggleFaq('faq3')}
                style={styles.faqRow}>
                <View style={styles.faqHeaderRow}>
                  <Text size="small" style={styles.faqQuestion}>
                    Is there individual doubt support offline?
                  </Text>
                  <Icon
                    name={faqExpanded.faq3 ? 'minus' : 'plus'}
                    size={16}
                    color={colors.outline}
                  />
                </View>
                {faqExpanded.faq3 && (
                  <Text size="small" style={styles.faqAnswer}>
                    Yes, we have dedicated doubt clearing rooms and face-to-face
                    mentors available daily for personalized conceptual clarity.
                  </Text>
                )}
              </TouchableOpacity>

              {/* Q4 */}
              <TouchableOpacity
                onPress={() => toggleFaq('faq4')}
                style={styles.faqRow}>
                <View style={styles.faqHeaderRow}>
                  <Text size="small" style={styles.faqQuestion}>
                    Do you conduct regular exams?
                  </Text>
                  <Icon
                    name={faqExpanded.faq4 ? 'minus' : 'plus'}
                    size={16}
                    color={colors.outline}
                  />
                </View>
                {faqExpanded.faq4 && (
                  <Text size="small" style={styles.faqAnswer}>
                    Absolutely. Weekly mock tests and chapter assessments are
                    conducted offline. Detailed performance charts are analyzed
                    and shared with parents during PTM sessions.
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
  heroHindiText: {
    fontSize: 10,
    lineHeight: 14,
    opacity: 0.8,
  },
  heroSlogan: {
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 5,
  },
  typingText: {
    fontSize: 11,
    marginTop: 5,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  heroPillBtn: {
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  heroBtnText: {
    color: '#fff',
    fontSize: 9.5,
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
  hero3dImage: {
    width: 100,
    height: 120,
    zIndex: 1,
  },
  locationCard: {
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    marginBottom: 15,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  locationText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  directionBtn: {
    borderRadius: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  directionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 14.5,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 15,
  },
  featureCard: {
    width: (width - 80) / 2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eaeaea',
    elevation: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontWeight: 'bold',
    fontSize: 12.5,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  channelCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelImage: {
    width: 60,
    height: 60,
  },
  channelInfo: {
    flex: 1,
  },
  channelBtn: {
    backgroundColor: '#25D366',
    borderRadius: 15,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  channelBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  formCard: {
    borderRadius: 16,
    padding: 15,
    elevation: 2,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  formTitle: {
    fontWeight: 'bold',
    fontSize: 15,
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
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
    marginVertical: 10,
    gap: 12,
  },
  brandingImage: {
    width: 80,
    height: 80,
  },
  brandingText: {
    flex: 1,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accordionTitle: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  accordionBody: {
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -6,
    marginBottom: 5,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#eaeaea',
  },
  faqRow: {
    marginVertical: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontWeight: 'bold',
    fontSize: 12,
    flex: 0.95,
  },
  faqAnswer: {
    marginTop: 4,
    color: 'gray',
    fontSize: 11,
    lineHeight: 16,
  },
});

export default OfflineTuitions;
