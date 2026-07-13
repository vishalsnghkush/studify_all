import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
  Image,
  Alert,
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
  'Master Topics',
  'Instant Doubts',
  'Mock Tests',
  'Daily Progress',
];

const gradeColors = [
  { bg: '#e3f2fd', border: '#90caf9', text: '#1565c0' }, // Jr (Blue)
  { bg: '#fce4ec', border: '#f48fb1', text: '#c2185b' }, // 6th (Pink)
  { bg: '#e8f5e9', border: '#a5d6a7', text: '#2e7d32' }, // 7th (Green)
  { bg: '#f3e5f5', border: '#ce93d8', text: '#7b1fa2' }, // 8th (Purple)
  { bg: '#fff3e0', border: '#ffcc80', text: '#ef6c00' }, // 9th (Orange)
  { bg: '#e0f2f1', border: '#80cbc4', text: '#00695c' }, // 10th (Teal)
  { bg: '#e8eaf6', border: '#9fa8da', text: '#283593' }, // 11th (Indigo)
  { bg: '#ffebee', border: '#ef9a9a', text: '#c62828' }, // 12th (Red)
];

const OnlineTuitions = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Collapsible sections state to avoid clutter
  const [expandedSection, setExpandedSection] = useState({
    tuitionFees: false,
    oneToOne: false,
    successPlan: false,
    referEarn: false,
    faqs: false,
  });

  const toggleSection = section => {
    setExpandedSection(prev => ({...prev, [section]: !prev[section]}));
  };

  // Form State for Demo Booking
  const [form, setForm] = useState({
    class_st: '',
    fname: '',
    email: '',
    mobile: '',
    state: '',
    desc: '',
  });

  const updateFormValue = ({name, value}) => {
    setForm(prev => ({...prev, [name]: value}));
  };

  // Dropdown options
  const classList = [
    {label: 'Class Jr (1st - 5th)', value: 'Class Jr (1st - 5th)'},
    {label: 'Class 6th (Aster)', value: 'Class 6th (Aster)'},
    {label: 'Class 7th (Aster)', value: 'Class 7th (Aster)'},
    {label: 'Class 8th (Aster)', value: 'Class 8th (Aster)'},
    {label: 'Class 9th (Nebula)', value: 'Class 9th (Nebula)'},
    {label: 'Class 10th (Nebula)', value: 'Class 10th (Nebula)'},
    {label: 'Class 11th (Nova)', value: 'Class 11th (Nova)'},
    {label: 'Class 12th (Nova)', value: 'Class 12th (Nova)'},
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
    {label: 'Other', value: 'Other'},
  ];

  // FAQ states
  const [faqExpanded, setFaqExpanded] = useState({
    faq1: false,
    faq2: false,
    faq3: false,
  });

  const toggleFaq = id => {
    setFaqExpanded(prev => ({...prev, [id]: !prev[id]}));
  };

  // Safe links helper
  const openLink = (url, title = 'Web Page') => {
    if (!url) {
      return;
    }
    if (
      url.startsWith('tel:') ||
      url.startsWith('https://wa.me') ||
      url.startsWith('https://whatsapp.com')
    ) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open redirect link');
      });
    } else {
      navigation.navigate('WebView', {url, title});
    }
  };

  // Booking submit via WhatsApp
  const handleBookingSubmit = () => {
    const {class_st, fname, email, mobile, state, desc} = form;
    if (!class_st || !fname || !mobile) {
      Alert.alert('Error', 'Please fill Class, Name and WhatsApp Number.');
      return;
    }
    const message = `Hi Studifysuccess! I want to book a Free Demo Class.\n\nHere are my details:\n👤 Name: ${fname}\n🎓 Class: ${class_st}\n📧 Email: ${
      email || 'Not Provided'
    }\n📞 WhatsApp: ${mobile}\n📍 State: ${
      state || 'Not Provided'
    }\n📚 Subject/Topic: ${
      desc || 'Not Provided'
    }\n\nPlease confirm my booking. Thanks!`;
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

  // Data for circular Grade badges
  const gradeBadches = [
    {title: 'Jr', batch: '1st - 5th', url: 'https://junior.studifysuccess.com/'},
    {
      title: '6th',
      batch: 'Aster',
      url: 'https://classes.studifysuccess.com/class/class-6',
    },
    {
      title: '7th',
      batch: 'Aster',
      url: 'https://classes.studifysuccess.com/class/class-7',
    },
    {
      title: '8th',
      batch: 'Aster',
      url: 'https://classes.studifysuccess.com/class/class-8',
    },
    {
      title: '9th',
      batch: 'Nebula',
      url: 'https://classes.studifysuccess.com/class/class-9',
    },
    {
      title: '10th',
      batch: 'Nebula',
      url: 'https://classes.studifysuccess.com/class/class-10',
    },
    {
      title: '11th',
      batch: 'Nova',
      url: 'https://classes.studifysuccess.com/class/class-11',
    },
    {
      title: '12th',
      batch: 'Nova',
      url: 'https://classes.studifysuccess.com/class/class-12',
    },
  ];

  return (
    <Screen
      padding={false}
      NoHeader={true}
      style={{backgroundColor: colors.background}}>
      {/* 1. RECREATED 3D BANNER */}
      <Card style={[styles.heroCard, {backgroundColor: colors.surface}]}>
        <View style={styles.heroRow}>
          {/* Left Text and Buttons */}
          <View style={styles.heroLeft}>
            <Text
              size="medium"
              style={[styles.heroHindiText, {color: colors.onSurface}]}>
              किताबों की पढ़ाई जब हो लाइव क्लास के साथ, सफलता मिलेगी हर बार आपके
              हाथ।
            </Text>
            <Text
              size="large"
              style={[styles.heroSlogan, {color: colors.primary}]}>
              Ignite Your Learning.
            </Text>
            <Text
              size="large"
              style={[styles.heroSloganSecondary, {color: colors.tertiary}]}>
              Ace Your Exams.
            </Text>

            <Text
              size="small"
              style={[styles.typingText, {color: colors.outline}]}>
              Learn to:{' '}
              <Text
                size="small"
                style={{fontWeight: 'bold', color: colors.primary}}>
                {phrases[phraseIndex]}
              </Text>
            </Text>

            <View style={styles.heroBtnRow}>
              <TouchableOpacity
                onPress={() =>
                  openLink(
                    'https://classes.studifysuccess.com/#book-trial-class',
                    'Book Demo',
                  )
                }
                style={[styles.heroPillBtn, {backgroundColor: '#3b82f6'}]}>
                <Text size="small" style={styles.heroBtnText}>
                  Demo Class ❯
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  openLink(
                    'https://classes.studifysuccess.com/#explore',
                    'Live Classes',
                  )
                }
                style={[styles.heroPillBtn, {backgroundColor: '#0f8a85'}]}>
                <Text size="small" style={styles.heroBtnText}>
                  Live Class ❯
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right overlapping 3D Girl Illustration */}
          <View style={styles.heroRight}>
            <View style={[styles.pinkCircle, {backgroundColor: '#ffdcdb'}]} />
            <Image
              source={{
                uri: 'https://www.studifysuccess.com/images/casual-life-3d-girl-sitting-on-floor-with-laptop-and-studying.webp',
              }}
              style={styles.hero3dImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Card>

      <View style={styles.content}>
        {/* 2. "WHAT WE PROVIDE" COMPACT COLORFUL ICON BUTTONS */}
        <View style={styles.sectionHeaderRow}>
          <Text
            size="medium"
            style={[styles.sectionTitle, {color: colors.primary}]}>
            What We Provide
          </Text>
        </View>

        <View style={styles.provideGrid}>
          {/* Study Materials */}
          <View style={styles.provideItem}>
            <View style={[styles.circleIcon, {backgroundColor: '#e3f2fd'}]}>
              <Icon name="book-open-page-variant" size={24} color="#1565c0" />
            </View>
            <Text
              size="small"
              style={[styles.provideLabel, {color: colors.onSurface}]}>
              Study Material
            </Text>
          </View>

          {/* Doubt Session */}
          <View style={styles.provideItem}>
            <View style={[styles.circleIcon, {backgroundColor: '#fce4ec'}]}>
              <Icon name="comment-question" size={24} color="#c2185b" />
            </View>
            <Text
              size="small"
              style={[styles.provideLabel, {color: colors.onSurface}]}>
              Doubt Session
            </Text>
          </View>

          {/* Test Series */}
          <View style={styles.provideItem}>
            <View style={[styles.circleIcon, {backgroundColor: '#e8f5e9'}]}>
              <Icon name="file-document-edit" size={24} color="#2e7d32" />
            </View>
            <Text
              size="small"
              style={[styles.provideLabel, {color: colors.onSurface}]}>
              Test Series
            </Text>
          </View>

          {/* Counselling */}
          <View style={styles.provideItem}>
            <View style={[styles.circleIcon, {backgroundColor: '#f3e5f5'}]}>
              <Icon name="account-voice" size={24} color="#7b1fa2" />
            </View>
            <Text
              size="small"
              style={[styles.provideLabel, {color: colors.onSurface}]}>
              Counselling
            </Text>
          </View>

          {/* Sample Papers */}
          <View style={styles.provideItem}>
            <View style={[styles.circleIcon, {backgroundColor: '#fff3e0'}]}>
              <Icon name="file-document-multiple" size={24} color="#ef6c00" />
            </View>
            <Text
              size="small"
              style={[styles.provideLabel, {color: colors.onSurface}]}>
              Sample Papers
            </Text>
          </View>

          {/* Question Bank */}
          <View style={styles.provideItem}>
            <View style={[styles.circleIcon, {backgroundColor: '#e0f2f1'}]}>
              <Icon name="database" size={24} color="#00695c" />
            </View>
            <Text
              size="small"
              style={[styles.provideLabel, {color: colors.onSurface}]}>
              Question Bank
            </Text>
          </View>
        </View>

        {/* 3. EXPLORE CLASSES (CIRCULAR GRADE BADGES) */}
        <View style={styles.sectionHeaderRow}>
          <Text
            size="medium"
            style={[styles.sectionTitle, {color: colors.primary}]}>
            Explore Live Classes
          </Text>
          <Text size="small" style={{color: colors.outline, fontSize: 12}}>
            Session 2026-27
          </Text>
        </View>

        <View style={styles.gradeGrid}>
          {gradeBadches.map((item, idx) => {
            const colorPair = gradeColors[idx % gradeColors.length];
            return (
              <TouchableOpacity
                key={idx}
                onPress={() =>
                  openLink(item.url, `${item.title} - ${item.batch}`)
                }
                style={[
                  styles.gradeCard,
                  {
                    backgroundColor: colorPair.bg,
                    borderColor: colorPair.border,
                  },
                ]}>
                <Text style={[styles.gradeCardTitle, {color: colorPair.text}]}>
                  {item.title}
                </Text>
                <Text style={[styles.gradeCardSubtitle, {color: colorPair.text}]}>
                  {item.batch}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Brochure Circular Badge */}
          <TouchableOpacity
            onPress={() =>
              openLink(
                'https://classes.studifysuccess.com/brochure/StudifySuccess%20BROCHURE%20Class%206-12.pdf',
                'Brochure',
              )
            }
            style={[
              styles.gradeCard,
              {
                backgroundColor: '#fffde7',
                borderColor: '#fff59d',
              },
            ]}>
            <Icon name="download" size={18} color="#f57f17" style={{marginBottom: 2}} />
            <Text style={[styles.gradeCardSubtitle, {color: '#f57f17', fontWeight: 'bold'}]}>
              Brochure
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. PREMIUM MODULES (CLEAN ACCORDIONS & COMPACT CARDS) */}

        {/* 1-on-1 Personalized Live Class */}
        <TouchableOpacity
          onPress={() => toggleSection('oneToOne')}
          style={[styles.accordionHeader, {backgroundColor: colors.surface}]}>
          <View style={styles.accordionHeaderLeft}>
            <Icon name="account-star" size={22} color={colors.primary} />
            <Text
              size="medium"
              style={[styles.accordionTitle, {color: colors.onSurface}]}>
              🎓 1 Teacher • 1 Student Wing
            </Text>
          </View>
          <Icon
            name={expandedSection.oneToOne ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.outline}
          />
        </TouchableOpacity>

        {expandedSection.oneToOne && (
          <View
            style={[styles.accordionBody, {backgroundColor: colors.surface}]}>
            <Text
              size="small"
              style={[styles.wingSubtitle, {color: colors.outline}]}>
              Premium 1-on-1 personalized tutoring for guaranteed academic
              results.
            </Text>
            <View style={styles.bulletItem}>
              <Icon name="check-circle" size={16} color={colors.primary} />
              <Text size="small" style={styles.bulletItemText}>
                Customized learning roadmap per subject
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="check-circle" size={16} color={colors.primary} />
              <Text size="small" style={styles.bulletItemText}>
                Zero distraction Live sessions (60-90 mins)
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="check-circle" size={16} color={colors.primary} />
              <Text size="small" style={styles.bulletItemText}>
                Direct progress tracker on your dashboard
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                openLink(
                  'https://wa.me/918447186881?text=Hi%20I%20want%20to%20book%20a%201-to-1%20Live%20Demo%20Session.',
                  'Book 1-1',
                )
              }
              style={[styles.miniEnrollBtn, {backgroundColor: colors.primary}]}>
              <Text size="small" style={styles.miniBtnText}>
                Book 1-on-1 Demo
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Academic Success Plan Subscription */}
        <TouchableOpacity
          onPress={() => toggleSection('successPlan')}
          style={[styles.accordionHeader, {backgroundColor: colors.surface}]}>
          <View style={styles.accordionHeaderLeft}>
            <Icon name="certificate" size={22} color={colors.primary} />
            <Text
              size="medium"
              style={[styles.accordionTitle, {color: colors.onSurface}]}>
              📚 Academic Success Plan
            </Text>
          </View>
          <Icon
            name={expandedSection.successPlan ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.outline}
          />
        </TouchableOpacity>

        {expandedSection.successPlan && (
          <View
            style={[styles.accordionBody, {backgroundColor: colors.surface}]}>
            <View style={styles.successPlanBadgeRow}>
              <Text size="small" style={styles.successPlanPrice}>
                ₹499{' '}
                <Text
                  size="small"
                  style={{fontWeight: 'normal', color: 'gray'}}>
                  / month
                </Text>
              </Text>
              <View style={styles.popularBadge}>
                <Text size="small" style={styles.popularBadgeText}>
                  Best Seller
                </Text>
              </View>
            </View>
            <Text
              size="small"
              style={{color: colors.outline, marginVertical: 8}}>
              Daily doubt resolution, assignments assistance & exam prep for
              Classes 6th - 10th.
            </Text>
            <TouchableOpacity
              onPress={() =>
                openLink(
                  'https://wa.me/918447186881?text=Hi%2C%20I%20want%20Homework%20Helper%20Premium%20Plan%20from%20Studifysuccess.%20Please%20share%20details.',
                  'Success Plan',
                )
              }
              style={[styles.miniEnrollBtn, {backgroundColor: '#25D366'}]}>
              <Icon name="whatsapp" size={16} color="#fff" />
              <Text size="small" style={styles.miniBtnText}>
                Enroll via WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Home Tuition Wing Fees */}
        <TouchableOpacity
          onPress={() => toggleSection('tuitionFees')}
          style={[styles.accordionHeader, {backgroundColor: colors.surface}]}>
          <View style={styles.accordionHeaderLeft}>
            <Icon name="home-analytics" size={22} color={colors.primary} />
            <Text
              size="medium"
              style={[styles.accordionTitle, {color: colors.onSurface}]}>
              🏡 Home Tuition Fee Wings
            </Text>
          </View>
          <Icon
            name={expandedSection.tuitionFees ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.outline}
          />
        </TouchableOpacity>

        {expandedSection.tuitionFees && (
          <View
            style={[styles.accordionBody, {backgroundColor: colors.surface}]}>
            <View style={styles.feeSectionRow}>
              <Text size="small" style={styles.feeHeading}>
                Primary Wing (KG-5th)
              </Text>
              <Text size="small" style={styles.feeValue}>
                ₹2.5k - 6k / Mo
              </Text>
            </View>
            <View style={styles.feeSectionRow}>
              <Text size="small" style={styles.feeHeading}>
                Middle Wing (6th-8th)
              </Text>
              <Text size="small" style={styles.feeValue}>
                ₹5k - 7k / Mo
              </Text>
            </View>
            <View style={styles.feeSectionRow}>
              <Text size="small" style={styles.feeHeading}>
                Secondary Wing (9th-12th)
              </Text>
              <Text size="small" style={styles.feeValue}>
                ₹7.5k - 10k / Mo
              </Text>
            </View>

            <View style={styles.feeBtnRow}>
              <TouchableOpacity
                onPress={() => openLink('tel:+918447186881')}
                style={[styles.feeBtn, {backgroundColor: colors.primary}]}>
                <Icon name="phone" size={14} color="#fff" />
                <Text size="small" style={styles.miniBtnText}>
                  Call Tutors
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  openLink('https://wa.me/918447186881', 'WhatsApp')
                }
                style={[styles.feeBtn, {backgroundColor: '#25D366'}]}>
                <Icon name="whatsapp" size={14} color="#fff" />
                <Text size="small" style={styles.miniBtnText}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 5. COMPACT PROMOTION BANNERS (REFER, OFFLINE, WHATSAPP CHANNEL) */}

        {/* Refer & Earn Banner */}
        <TouchableOpacity
          onPress={() =>
            openLink(
              'https://classes.studifysuccess.com/#explore',
              'Refer & Earn',
            )
          }
          style={[styles.promoBannerRow, {backgroundColor: colors.surface}]}>
          <Icon name="gift-outline" size={24} color={colors.tertiary} />
          <View style={styles.promoTextColumn}>
            <Text
              size="small"
              style={{fontWeight: 'bold', color: colors.onSurface}}>
              Refer & Earn ₹1000
            </Text>
            <Text size="small" style={{color: colors.outline, fontSize: 11}}>
              Invite friends to earn cash rewards on course purchase.
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        {/* Offline Coaching Banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('OfflineTuitions')}
          style={[styles.promoBannerRow, {backgroundColor: colors.surface}]}>
          <Icon name="map-marker-radius" size={24} color={colors.primary} />
          <View style={styles.promoTextColumn}>
            <Text
              size="small"
              style={{fontWeight: 'bold', color: colors.onSurface}}>
              Offline Coaching Batch
            </Text>
            <Text size="small" style={{color: colors.outline, fontSize: 11}}>
              Register for offline classes at our New Delhi Center.
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        {/* WhatsApp Channel & Critical Thinking */}
        <View style={styles.flexHalfRow}>
          <TouchableOpacity
            onPress={() =>
              openLink(
                'https://whatsapp.com/channel/0029Va6q4MV2UPBNhRUyGh28',
                'WhatsApp Channel',
              )
            }
            style={[styles.halfBanner, {backgroundColor: colors.surface}]}>
            <Icon name="bell-ring-outline" size={20} color="#25D366" />
            <Text size="small" style={styles.halfBannerText}>
              Join WA Channel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Activities')}
            style={[styles.halfBanner, {backgroundColor: colors.surface}]}>
            <Icon name="brain" size={20} color={colors.tertiary} />
            <Text size="small" style={styles.halfBannerText}>
              Logical Puzzles
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() =>
            openLink('https://business.studifysuccess.com', 'B2B Growth')
          }
          style={[
            styles.promoBannerRow,
            {backgroundColor: colors.surface, marginTop: 5},
          ]}>
          <Icon name="briefcase-outline" size={24} color={colors.primary} />
          <View style={styles.promoTextColumn}>
            <Text
              size="small"
              style={{fontWeight: 'bold', color: colors.onSurface}}>
              B2B Growth Partner
            </Text>
            <Text size="small" style={{color: colors.outline, fontSize: 11}}>
              Grow your offline center with StudifySuccess network.
            </Text>
          </View>
          <Icon name="arrow-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        {/* 6. BOOK A FREE DEMO FORM (SLEEK MOBILE FORM) */}
        <Card style={[styles.formCard, {backgroundColor: colors.surface}]}>
          <Text
            size="medium"
            style={[styles.formTitle, {color: colors.primary}]}>
            🎯 Book Your Free Demo Session
          </Text>
          <Text
            size="small"
            style={{
              color: colors.outline,
              textAlign: 'center',
              marginBottom: 15,
              fontSize: 12,
            }}>
            Fill your details to connect with a mentor immediately
          </Text>

          <Dropdown
            label="Select Class"
            name="class_st"
            value={form.class_st}
            updateFormValue={updateFormValue}
            list={classList}
          />
          <View style={{height: 5}} />

          <InputText
            label="Full Name"
            name="fname"
            value={form.fname}
            updateFormValue={updateFormValue}
          />

          <InputText
            label="WhatsApp Number (10 Digits)"
            name="mobile"
            value={form.mobile}
            updateFormValue={updateFormValue}
            keyboard="numeric"
            maxLength={10}
          />

          <Dropdown
            label="State"
            name="state"
            value={form.state}
            updateFormValue={updateFormValue}
            list={stateList}
          />
          <View style={{height: 5}} />

          <InputText
            label="Subject & Topic Name"
            name="desc"
            value={form.desc}
            updateFormValue={updateFormValue}
            multiline={2}
          />

          <InputButton
            name="Request Booking via WhatsApp"
            onPress={handleBookingSubmit}
            style={{marginTop: 10, height: 48, borderRadius: 24}}
          />

          <TouchableOpacity
            onPress={() =>
              openLink(
                'https://classes.studifysuccess.com/#book-trial-class',
                'Website Book',
              )
            }
            style={styles.webBookLink}>
            <Text
              size="small"
              style={{
                color: colors.primary,
                textDecorationLine: 'underline',
                fontSize: 12,
              }}>
              Or book on classes.studifysuccess.com
            </Text>
          </TouchableOpacity>
        </Card>

        {/* PTM Banner */}
        <View
          style={[styles.ptmRow, {backgroundColor: colors.elevation.level1}]}>
          <Icon
            name="account-multiple-check"
            size={24}
            color={colors.primary}
          />
          <Text
            size="small"
            style={[styles.ptmText, {color: colors.onSurface}]}>
            StudifySuccess offers **PTM** (Parent-Teacher Meetings) for regular
            student tracking.
          </Text>
        </View>

        {/* 7. FACTS / COUNTER (SIMPLE ROW) */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text
              size="medium"
              style={[styles.statNum, {color: colors.primary}]}>
              10k+
            </Text>
            <Text size="small" style={styles.statLabel}>
              Students
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text
              size="medium"
              style={[styles.statNum, {color: colors.primary}]}>
              5k+
            </Text>
            <Text size="small" style={styles.statLabel}>
              Classes
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text
              size="medium"
              style={[styles.statNum, {color: colors.primary}]}>
              4k+
            </Text>
            <Text size="small" style={styles.statLabel}>
              Interact
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text
              size="medium"
              style={[styles.statNum, {color: colors.primary}]}>
              5k+
            </Text>
            <Text size="small" style={styles.statLabel}>
              Reviews
            </Text>
          </View>
        </View>

        {/* 8. TESTIMONIAL CHIP */}
        <View style={[styles.testiBox, {backgroundColor: colors.surface}]}>
          <Icon name="format-quote-open" size={24} color={colors.primary} />
          <Text
            size="small"
            style={{
              fontStyle: 'italic',
              fontSize: 12,
              lineHeight: 18,
              color: colors.onSurface,
            }}>
            "Excellent live classes. Teachers explain complex topics simply, and
            the progress dashboard keeps parents updated."
          </Text>
          <Text
            size="small"
            style={{
              fontWeight: 'bold',
              alignSelf: 'flex-end',
              marginTop: 5,
              color: colors.primary,
            }}>
            — Aayush & Shreya
          </Text>
        </View>

        {/* 9. FAQs COLLAPSIBLE ACCORDION */}
        <TouchableOpacity
          onPress={() => toggleSection('faqs')}
          style={[
            styles.accordionHeader,
            {backgroundColor: colors.surface, marginTop: 15},
          ]}>
          <View style={styles.accordionHeaderLeft}>
            <Icon name="help-circle-outline" size={22} color={colors.primary} />
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
                  What are live classes?
                </Text>
                <Icon
                  name={faqExpanded.faq1 ? 'minus' : 'plus'}
                  size={16}
                  color={colors.outline}
                />
              </View>
              {faqExpanded.faq1 && (
                <Text size="small" style={styles.faqAnswer}>
                  Live classes are real-time, interactive online sessions where
                  teachers explain concepts and clear doubts synchronously.
                </Text>
              )}
            </TouchableOpacity>

            {/* Q2 */}
            <TouchableOpacity
              onPress={() => toggleFaq('faq2')}
              style={styles.faqRow}>
              <View style={styles.faqHeaderRow}>
                <Text size="small" style={styles.faqQuestion}>
                  Are they effective?
                </Text>
                <Icon
                  name={faqExpanded.faq2 ? 'minus' : 'plus'}
                  size={16}
                  color={colors.outline}
                />
              </View>
              {faqExpanded.faq2 && (
                <Text size="small" style={styles.faqAnswer}>
                  Absolutely. With 1-on-1 mapping, interactive boards, mock
                  exams, and instant doubt resolution, they build strong
                  conceptual foundations.
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{height: 30}} />
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
    fontSize: 15,
    marginTop: 5,
  },
  heroSloganSecondary: {
    fontWeight: 'bold',
    fontSize: 15,
    lineHeight: 16,
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
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnText: {
    color: '#fff',
    fontSize: 9,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  provideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  provideItem: {
    width: (width - 80) / 3,
    alignItems: 'center',
    marginVertical: 5,
  },
  circleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    position: 'relative',
  },
  tinyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2e7d32',
    position: 'absolute',
    top: 2,
    right: 2,
    borderWidth: 1,
    borderColor: '#fff',
  },
  provideLabel: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: 'bold',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 15,
  },
  gradeCard: {
    width: (width - 48) / 3,
    height: 76,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginVertical: 6,
  },
  gradeCardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  gradeCardSubtitle: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '600',
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
    fontSize: 13.5,
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
  wingSubtitle: {
    fontSize: 11,
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  bulletItemText: {
    fontSize: 11.5,
    flex: 1,
  },
  miniEnrollBtn: {
    borderRadius: 15,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    flexDirection: 'row',
    gap: 6,
  },
  miniBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11.5,
  },
  successPlanBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successPlanPrice: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  popularBadge: {
    backgroundColor: '#0d6efd',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  feeSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  feeHeading: {
    fontSize: 12,
  },
  feeValue: {
    fontWeight: 'bold',
    color: '#2e7d32',
    fontSize: 12,
  },
  feeBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  feeBtn: {
    flex: 1,
    borderRadius: 15,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  promoBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#eaeaea',
    gap: 10,
  },
  promoTextColumn: {
    flex: 1,
  },
  flexHalfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 5,
  },
  halfBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#eaeaea',
    gap: 8,
  },
  halfBannerText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  b2bCard: {
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    marginVertical: 5,
  },
  b2bBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 5,
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
    fontSize: 15.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  webBookLink: {
    alignSelf: 'center',
    marginTop: 10,
  },
  ptmRow: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  ptmText: {
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statLabel: {
    color: 'gray',
    fontSize: 11,
  },
  testiBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginVertical: 10,
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
  },
  faqAnswer: {
    marginTop: 4,
    color: 'gray',
    fontSize: 11,
    lineHeight: 16,
  },
});

export default OnlineTuitions;
