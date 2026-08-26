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
import {useTheme, Card, Checkbox} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RazorpayCheckout from 'react-native-razorpay';
import {useSelector} from 'react-redux';
import useApi from '../../Components/Api/Api';

// Core UI imports from the project
import Screen from '../../Components/Screen/Screen';
import Text from '../../Components/Input/Text';
import InputText from '../../Components/Input/TextInput';
import Dropdown from '../../Components/Input/Dropdown';
import InputButton from '../../Components/Input/Button';

const {width} = Dimensions.get('window');

const phrases = [
  'Exams Stress?',
  'Career',
  'Guidance?',
  'Stream Choose',
  "Don't Worry",
  'Book a',
  'Counseling',
  'Today',
];

const serviceItems = [
  {
    title: 'Live Interaction',
    img: 'https://www.studifysuccess.com/images/cc-interactions.webp',
    desc: 'Connect in real-time with verified academic counsellors.',
  },
  {
    title: 'Doubts Solve',
    img: 'https://www.studifysuccess.com/images/cc-question.webp',
    desc: 'Resolve all career path and syllabus confusion instantly.',
  },
  {
    title: 'Career Guide',
    img: 'https://www.studifysuccess.com/images/cc-.webp',
    desc: 'Choose stream & courses aligned with your strengths.',
  },
  {
    title: 'Self Growth',
    img: 'https://www.studifysuccess.com/images/cc-success.webp',
    desc: 'Develop motivation, study habits & stress resilience.',
  },
];

const schoolClassList = [
  {label: 'Class 6th (Aster)', value: 'Class 6th (Aster)'},
  {label: 'Class 7th (Aster)', value: 'Class 7th (Aster)'},
  {label: 'Class 8th (Aster)', value: 'Class 8th (Aster)'},
  {label: 'Class 9th (Nebula)', value: 'Class 9th (Nebula)'},
  {label: 'Class 10th (Nebula)', value: 'Class 10th (Nebula)'},
  {label: 'Class 11th (Nova)', value: 'Class 11th (Nova)'},
  {label: 'Class 12th (Nova)', value: 'Class 12th (Nova)'},
  {label: 'After 10th (Stream Choose)', value: 'After 10th (Stream Choose)'},
  {label: 'After 12th (Career Choose)', value: 'After 12th (Career Choose)'},
];

const collegeYearList = [
  {label: '1st Year', value: '1st Year'},
  {label: '2nd Year', value: '2nd Year'},
  {label: '3rd Year', value: '3rd Year'},
  {label: '4th Year', value: '4th Year'},
  {label: 'Others', value: 'Others'},
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

const Counselling = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const scrollViewRef = useRef(null);
  const formCardRef = useRef(null);
  const [formYPosition, setFormYPosition] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const [studentType, setStudentType] = useState('School Student'); // 'School Student' or 'College Student'
  const [acceptedTnc, setAcceptedTnc] = useState(true);

  const [form, setForm] = useState({
    classOrYear: '',
    fname: '',
    email: '',
    mobile: '',
    state: '',
    rcode: '',
  });

  const updateFormValue = ({name, value}) => {
    setForm(prev => ({...prev, [name]: value}));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // FAQ States
  const [faqExpanded, setFaqExpanded] = useState({
    faq1: false,
    faq2: false,
    faq3: false,
  });

  const toggleFaq = id => {
    setFaqExpanded(prev => ({...prev, [id]: !prev[id]}));
  };

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

  const scrollToForm = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: formYPosition, animated: true});
    }
  };

  const user = useSelector(state => state.initial.user);
  const { post } = useApi();
  const [bookingPaying, setBookingPaying] = useState(false);

  const handleBookingSubmit = async () => {
    const {classOrYear, fname, email, mobile, state, rcode} = form;
    if (!classOrYear || !fname || !mobile) {
      Alert.alert(
        'Error',
        `Please enter your Name, Phone and select your ${
          studentType === 'School Student' ? 'Class' : 'Year'
        }.`,
      );
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit Phone Number.');
      return;
    }
    if (!acceptedTnc) {
      Alert.alert('Error', 'Please accept the Terms & Conditions.');
      return;
    }

    setBookingPaying(true);
    const RAZORPAY_KEY = 'rzp_test_TNciL5Zn3FHf5v';
    const PRICE = 149;

    const options = {
      description: 'Career Counselling Booking',
      image: 'https://www.studifysuccess.com/images/logo.png',
      currency: 'INR',
      key: RAZORPAY_KEY,
      amount: PRICE * 100,
      name: 'StudifySuccess',
      prefill: {
        email: email || user?.email || '',
        contact: mobile || (user?.phone ? String(user.phone) : ''),
        name: fname || `${user?.fname || ''} ${user?.lname || ''}`.trim() || 'User',
      },
      theme: { color: '#3F51B5' },
    };

    try {
      const data = await RazorpayCheckout.open(options);
      await post('/payment/unlock-item', {
        item_key: 'counselling_booking',
        title: 'Career Counselling Session',
        amount: PRICE,
        payment_id: data.razorpay_payment_id,
      });

      Alert.alert('Payment Successful! 🎉', 'Your Guided Counselling Session has been booked!');

      const message = `Hi Studifysuccess! I have paid ₹${PRICE} for Guided Counselling Session.\n\nPayment ID: ${data.razorpay_payment_id}\n\nDetails:\n👤 Name: ${fname}\n🎓 Category: ${studentType}\n📚 ${
        studentType === 'School Student' ? 'Class' : 'Year'
      }: ${classOrYear}\n📧 Email: ${
        email || 'Not Provided'
      }\n📞 Phone: ${mobile}\n📍 State: ${
        state || 'Not Provided'
      }\n🎟️ Referral Code: ${
        rcode || 'None'
      }`;
      const whatsappUrl = `https://wa.me/918447186881?text=${encodeURIComponent(
        message,
      )}`;
      Linking.openURL(whatsappUrl).catch(() => {
        Alert.alert(
          'Error',
          'WhatsApp not found. Contact +91 8447186881 directly.',
        );
      });
    } catch (err) {
      if (err?.code !== 2) {
        Alert.alert('Payment Cancelled/Failed', err?.description || err?.message || 'The checkout sheet closed.');
      }
    } finally {
      setBookingPaying(false);
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
        {/* 1. HERO BANNER */}
        <Card style={[styles.heroCard, {backgroundColor: colors.surface}]}>
          <View style={styles.heroRow}>
            {/* Left Content */}
            <View style={styles.heroLeft}>
              <Text
                size="medium"
                style={[styles.heroHeading, {color: colors.primary}]}>
                Guided Counselling
              </Text>

              <Text
                size="small"
                style={[styles.typingText, {color: colors.outline}]}>
                Don't Worry:{' '}
                <Text
                  size="small"
                  style={{fontWeight: 'bold', color: colors.primary}}>
                  {phrases[phraseIndex]}
                </Text>
              </Text>
              <Text
                size="small"
                style={[
                  styles.heroDescription,
                  {color: colors.onSurfaceVariant},
                ]}>
                Consult our expert mentors to resolve exam anxiety, choose the
                correct stream, manage stress, and make informed career plans.
              </Text>

              <View style={styles.heroBtnRow}>
                <TouchableOpacity
                  onPress={scrollToForm}
                  style={[
                    styles.heroPillBtn,
                    {backgroundColor: colors.primary},
                  ]}>
                  <Text size="small" style={styles.heroBtnText}>
                    Book Slot ❯
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    openLink(
                      'https://wa.me/918447186881?text=Hello%20Studifysuccess!%20I%20want%20to%20connect%20with%20a%20counsellor.',
                      'Counselling Helpline',
                    )
                  }
                  style={[styles.heroPillBtn, {backgroundColor: '#25D366'}]}>
                  <Icon name="whatsapp" size={14} color="#fff" />
                  <Text
                    size="small"
                    style={[styles.heroBtnText, {marginLeft: 4}]}>
                    Chat ❯
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Side Illustration */}
            <View style={styles.heroRight}>
              <View style={[styles.pinkCircle, {backgroundColor: '#ffdcdb'}]} />
              <Image
                source={{
                  uri: 'https://www.studifysuccess.com/images/counselling_studifysuccess.webp',
                }}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </Card>

        <View style={styles.content}>
          {/* 2. SERVICES GRID: WHAT WE PROVIDE */}
          <View style={styles.sectionHeaderRow}>
            <Text
              size="medium"
              style={[styles.sectionTitle, {color: colors.primary}]}>
              What We Provide
            </Text>
          </View>

          <View style={styles.serviceGrid}>
            {serviceItems.map((item, idx) => (
              <View
                key={idx}
                style={[styles.serviceCard, {backgroundColor: colors.surface}]}>
                <Image
                  source={{uri: item.img}}
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
                <Text
                  size="small"
                  style={[styles.serviceLabel, {color: colors.onSurface}]}>
                  {item.title}
                </Text>
                <Text size="small" style={styles.serviceDesc}>
                  {item.desc}
                </Text>
              </View>
            ))}
          </View>

          {/* 3. COUNTER STATS ROW */}
          <View
            style={[styles.statsContainer, {backgroundColor: colors.surface}]}>
            <View style={styles.statItem}>
              <Text
                size="medium"
                style={[styles.statNumber, {color: colors.primary}]}>
                100+
              </Text>
              <Text size="small" style={styles.statLabel}>
                Students
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                size="medium"
                style={[styles.statNumber, {color: colors.primary}]}>
                200+
              </Text>
              <Text size="small" style={styles.statLabel}>
                Sessions
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                size="medium"
                style={[styles.statNumber, {color: colors.primary}]}>
                150+
              </Text>
              <Text size="small" style={styles.statLabel}>
                Live Interact
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                size="medium"
                style={[styles.statNumber, {color: colors.primary}]}>
                100+
              </Text>
              <Text size="small" style={styles.statLabel}>
                Reviews
              </Text>
            </View>
          </View>

          {/* 4. DYNAMIC BOOKING FORM */}
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
                📝 Book Your Counselling Slot
              </Text>
              <Text
                size="small"
                style={{
                  color: colors.outline,
                  textAlign: 'center',
                  marginBottom: 15,
                  fontSize: 12,
                }}>
                Talk to experts • Fill the details below
              </Text>

              {/* School / College Student Toggle Tabs */}
              <View
                style={[
                  styles.tabContainer,
                  {borderColor: colors.outlineVariant},
                ]}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    studentType === 'School Student' && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setStudentType('School Student');
                    updateFormValue({name: 'classOrYear', value: ''});
                  }}>
                  <Text
                    size="small"
                    style={[
                      styles.tabText,
                      studentType === 'School Student' && {
                        color: '#fff',
                        fontWeight: 'bold',
                      },
                    ]}>
                    School Student
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    studentType === 'College Student' && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setStudentType('College Student');
                    updateFormValue({name: 'classOrYear', value: ''});
                  }}>
                  <Text
                    size="small"
                    style={[
                      styles.tabText,
                      studentType === 'College Student' && {
                        color: '#fff',
                        fontWeight: 'bold',
                      },
                    ]}>
                    College Student
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{height: 10}} />

              {/* Dynamic Dropdown Select */}
              {studentType === 'School Student' ? (
                <Dropdown
                  label="Select Class *"
                  name="classOrYear"
                  value={form.classOrYear}
                  updateFormValue={updateFormValue}
                  list={schoolClassList}
                />
              ) : (
                <Dropdown
                  label="Select Year *"
                  name="classOrYear"
                  value={form.classOrYear}
                  updateFormValue={updateFormValue}
                  list={collegeYearList}
                />
              )}
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
              <View style={{height: 5}} />

              <InputText
                label="Referral code (optional)"
                name="rcode"
                value={form.rcode}
                updateFormValue={updateFormValue}
                maxLength={6}
              />

              {/* Terms and Conditions Checkbox */}
              <View style={styles.tncContainer}>
                <Checkbox
                  status={acceptedTnc ? 'checked' : 'unchecked'}
                  onPress={() => setAcceptedTnc(!acceptedTnc)}
                  color={colors.primary}
                />
                <Text size="small" style={styles.tncLabel}>
                  I accept the{' '}
                  <Text
                    size="small"
                    style={{
                      color: colors.primary,
                      textDecorationLine: 'underline',
                    }}
                    onPress={() =>
                      openLink(
                        'https://www.studifysuccess.com/terms-conditions',
                        'Terms & Conditions',
                      )
                    }>
                    Terms & Conditions
                  </Text>
                </Text>
              </View>

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
                  Have questions? Connect directly with us
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    openLink(
                      'https://wa.me/918447186881?text=Hello%20Studifysuccess!%20I%20have%20questions%20regarding%20career%20counselling.',
                      'Helpline',
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

          {/* 5. FAQs ACCORDION */}
          <View style={{marginTop: 10}}>
            <TouchableOpacity
              onPress={() => toggleFaq('faq1')}
              style={[
                styles.accordionHeader,
                {backgroundColor: colors.surface},
              ]}>
              <Text
                size="small"
                style={[styles.faqQuestion, {color: colors.onSurface}]}>
                Q. What are student counseling sessions?
              </Text>
              <Icon
                name={faqExpanded.faq1 ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.outline}
              />
            </TouchableOpacity>
            {faqExpanded.faq1 && (
              <View
                style={[
                  styles.accordionBody,
                  {backgroundColor: colors.surface},
                ]}>
                <Text size="small" style={styles.faqAnswer}>
                  Student counseling sessions are confidential meetings between
                  students and trained counselors or therapists aimed at
                  addressing various personal, academic, and emotional
                  challenges.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => toggleFaq('faq2')}
              style={[
                styles.accordionHeader,
                {backgroundColor: colors.surface},
              ]}>
              <Text
                size="small"
                style={[styles.faqQuestion, {color: colors.onSurface}]}>
                Q. How can counseling sessions benefit students academically?
              </Text>
              <Icon
                name={faqExpanded.faq2 ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.outline}
              />
            </TouchableOpacity>
            {faqExpanded.faq2 && (
              <View
                style={[
                  styles.accordionBody,
                  {backgroundColor: colors.surface},
                ]}>
                <Text size="small" style={styles.faqAnswer}>
                  • Helping manage stress and anxiety related to academic
                  pressures.{'\n'}• Teaching effective time management and study
                  skills.{'\n'}• Addressing perfectionism or procrastination.
                  {'\n'}• Providing support during periods of academic struggle.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => toggleFaq('faq3')}
              style={[
                styles.accordionHeader,
                {backgroundColor: colors.surface},
              ]}>
              <Text
                size="small"
                style={[styles.faqQuestion, {color: colors.onSurface}]}>
                Q. How often should students attend counseling sessions?
              </Text>
              <Icon
                name={faqExpanded.faq3 ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.outline}
              />
            </TouchableOpacity>
            {faqExpanded.faq3 && (
              <View
                style={[
                  styles.accordionBody,
                  {backgroundColor: colors.surface},
                ]}>
                <Text size="small" style={styles.faqAnswer}>
                  The counselor and student collaborate to determine a schedule
                  that best supports the student's goals and progress.
                </Text>
              </View>
            )}
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
  heroHeading: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  typingText: {
    fontSize: 12,
    marginTop: 5,
  },
  heroDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginVertical: 8,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 5,
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
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  serviceCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaeaea',
    elevation: 1,
    marginVertical: 6,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 10,
    color: 'gray',
    textAlign: 'center',
    lineHeight: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    marginVertical: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    fontSize: 15.5,
  },
  statLabel: {
    fontSize: 10,
    color: 'gray',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    height: 40,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
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
  tncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  tncLabel: {
    fontSize: 12.5,
    flex: 1,
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
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  faqQuestion: {
    fontWeight: 'bold',
    fontSize: 12,
    flex: 0.95,
  },
  accordionBody: {
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -8,
    marginBottom: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#eaeaea',
  },
  faqAnswer: {
    color: 'gray',
    fontSize: 11,
    lineHeight: 16,
  },
});

export default Counselling;
