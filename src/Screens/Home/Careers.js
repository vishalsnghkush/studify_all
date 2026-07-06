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

const {width} = Dimensions.get('window');

const phrases = [
  'Nakama Culture',
  'Growth Mindset',
  'Skill Internships',
  'PPO Opportunities',
];

const Careers = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const scrollViewRef = useRef(null);
  const categoriesGridRef = useRef(null);
  const [categoriesYPosition, setCategoriesYPosition] = useState(0);

  // Typing animation phrase cycler
  const [phraseIndex, setPhraseIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Safe redirect link helper
  const openLink = (url, title = 'Web Page') => {
    if (!url) {
      return;
    }
    if (
      url.startsWith('tel:') ||
      url.startsWith('https://wa.me') ||
      url.startsWith('https://whatsapp.com') ||
      url.startsWith('https://api.whatsapp.com') ||
      url.startsWith('https://forms.gle')
    ) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open redirection link');
      });
    } else {
      navigation.navigate('WebView', {url, title});
    }
  };

  // Scroll to Categories Grid
  const scrollToCategories = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: categoriesYPosition, animated: true});
    }
  };

  // Internship categories data
  const categoriesList = [
    {
      title: 'Academics',
      img: 'https://www.studifysuccess.com/images/job_teaching.webp',
      type: 'native',
    },
    {
      title: 'Campus Ambassador',
      img: 'https://www.studifysuccess.com/images/campus.webp',
      type: 'native',
    },
    {
      title: 'Career Counsellor',
      img: 'https://www.studifysuccess.com/images/job_counselor.webp',
      type: 'native',
    },
    {
      title: 'Communication And Engagement',
      img: 'https://www.studifysuccess.com/images/cch.webp',
      type: 'native',
    },
    {
      title: 'Content Writing',
      img: 'https://www.studifysuccess.com/images/job_content-writing.webp',
      type: 'native',
    },
    {
      title: 'Customer Support',
      img: 'https://www.studifysuccess.com/images/job_customer-service.webp',
      type: 'native',
    },
    {
      title: 'Data Analysis',
      img: 'https://www.studifysuccess.com/images/analysis.webp',
      type: 'native',
    },
    {
      title: 'Digital Marketing',
      img: 'https://www.studifysuccess.com/images/job_seo.webp',
      type: 'native',
    },
    {
      title: 'Finance',
      img: 'https://www.studifysuccess.com/images/job_budget.webp',
      type: 'native',
    },
    {
      title: 'Graphics Design',
      img: 'https://www.studifysuccess.com/images/graphic-designer.webp',
      type: 'native',
    },
    {
      title: 'Human Resource',
      img: 'https://www.studifysuccess.com/images/job_service.webp',
      type: 'native',
    },
    {
      title: 'Operations And Growth',
      img: 'https://www.studifysuccess.com/images/os.webp',
      type: 'native',
    },
    {
      title: 'Project Management',
      img: 'https://www.studifysuccess.com/images/planning.webp',
      type: 'native',
    },
    {
      title: 'Public Relations',
      img: 'https://www.studifysuccess.com/images/public-relations.webp',
      type: 'native',
    },
    {
      title: 'Research And Dev',
      img: 'https://www.studifysuccess.com/images/research-and-development.webp',
      type: 'native',
    },
    {
      title: 'Sales And Marketing',
      img: 'https://www.studifysuccess.com/images/job_social-media.webp',
      type: 'native',
    },
    {
      title: 'Social Media Management',
      img: 'https://www.studifysuccess.com/images/social-media.webp',
      type: 'native',
    },
    {
      title: 'Teaching',
      img: 'https://www.studifysuccess.com/images/nc-teaching.webp',
      type: 'native',
    },
    {
      title: 'Tech',
      img: 'https://www.studifysuccess.com/images/virtual.webp',
      type: 'native',
    },
    {
      title: 'Video Editing',
      img: 'https://www.studifysuccess.com/images/montage.webp',
      type: 'native',
    },
    {
      title: 'Brochure',
      img: 'https://www.studifysuccess.com/images/download.webp',
      type: 'link',
      url: 'https://careers.studifysuccess.com/brochure/Studifysuccess%20Internships.pdf',
    },
    {
      title: 'TL Program',
      img: 'https://www.studifysuccess.com/images/leader.webp',
      type: 'link',
      url: 'https://careers.studifysuccess.com/studifysuccess-training-program',
      badge: 'New',
    },
    {
      title: 'Partner Program',
      img: 'https://www.studifysuccess.com/images/partners.webp',
      type: 'link',
      url: 'https://forms.gle/huVVHofwmGYXAWZUA',
      badge: 'New',
    },
  ];

  // Category press handler
  const handleCategoryPress = item => {
    if (item.type === 'native') {
      navigation.navigate('Internship', {category: item.title});
    } else {
      openLink(item.url, item.title);
    }
  };

  // Drop resume handler
  const handleDropResume = () => {
    const message =
      'Hi Studifysuccess! I want to drop my resume for future job/internship opportunities at your company. Please let me know the process.';
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
                size="medium"
                style={[styles.heroHeading, {color: colors.primary}]}>
                Experience
              </Text>
              <Text
                size="small"
                style={[styles.typingText, {color: colors.outline}]}>
                Explore:{' '}
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
                At StudifySuccess, we make learning enjoyable and inspire a love
                for it in everyone. Learn, grow, and have fun!
              </Text>

              <View style={styles.heroBtnRow}>
                <TouchableOpacity
                  onPress={scrollToCategories}
                  style={[
                    styles.heroPillBtn,
                    {backgroundColor: colors.primary},
                  ]}>
                  <Text size="small" style={styles.heroBtnText}>
                    Internships ❯
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    openLink(
                      'https://careers.studifysuccess.com/resume-builder',
                      'Resume Builder',
                    )
                  }
                  style={[styles.heroPillBtn, {backgroundColor: '#3b82f6'}]}>
                  <Text size="small" style={styles.heroBtnText}>
                    Resume ❯
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Side Illustration */}
            <View style={styles.heroRight}>
              <View style={[styles.pinkCircle, {backgroundColor: '#ffdcdb'}]} />
              <Image
                source={{
                  uri: 'https://www.studifysuccess.com/images/3d-business-man-and-woman-working-at-the-table.webp',
                }}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Banner bottom links */}
          <View style={styles.bannerBottomLinks}>
            <TouchableOpacity
              onPress={() =>
                openLink(
                  'https://careers.studifysuccess.com/placement-guidance',
                  'Placement Guidance',
                )
              }
              style={styles.bottomLinkItem}>
              <Icon
                name="briefcase-check-outline"
                size={16}
                color={colors.primary}
              />
              <Text
                size="small"
                style={[styles.bottomLinkText, {color: colors.onSurface}]}>
                Placement
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                openLink(
                  'https://careers.studifysuccess.com/mock-interview',
                  'Mock Interview',
                )
              }
              style={styles.bottomLinkItem}>
              <Icon name="account-voice" size={16} color={colors.primary} />
              <Text
                size="small"
                style={[styles.bottomLinkText, {color: colors.onSurface}]}>
                Mock Interviews
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.content}>
          {/* 2. STATS ROW */}
          <View
            style={[styles.statsContainer, {backgroundColor: colors.surface}]}>
            <View style={styles.statItem}>
              <Text
                size="medium"
                style={[styles.statNumber, {color: colors.primary}]}>
                50k+
              </Text>
              <Text size="small" style={styles.statLabel}>
                Applications
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                size="medium"
                style={[styles.statNumber, {color: colors.primary}]}>
                10k+
              </Text>
              <Text size="small" style={styles.statLabel}>
                Certificates
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                size="medium"
                style={[styles.statNumber, {color: colors.primary}]}>
                5k+
              </Text>
              <Text size="small" style={styles.statLabel}>
                Interns
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                size="medium"
                style={[styles.statNumber, {color: colors.primary}]}>
                4.8★
              </Text>
              <Text size="small" style={styles.statLabel}>
                Reviews
              </Text>
            </View>
          </View>

          {/* 3. WHATSAPP CHANNEL BUBBLE */}
          <Card style={[styles.channelCard, {backgroundColor: '#eafaf1'}]}>
            <View style={styles.channelRow}>
              <Image
                source={{uri: 'https://www.studifysuccess.com/images/ssi.webp'}}
                style={styles.channelImage}
                resizeMode="contain"
              />
              <View style={styles.channelInfo}>
                <Text
                  size="medium"
                  style={{fontWeight: 'bold', color: '#1b5e20'}}>
                  Join Careers WhatsApp Channel
                </Text>
                <Text
                  size="small"
                  style={{color: '#2e7d32', fontSize: 11, marginVertical: 3}}>
                  Get instant job updates, internship openings, recruitment
                  alerts, and placement tips.
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    openLink(
                      'https://whatsapp.com/channel/0029VawrfSRBKfi5qBZozG1D',
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

          {/* 4. EXPLORE BY CATEGORY GRID */}
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
                Explore by Category
              </Text>
            </View>

            <Card style={[styles.quoteCard, {backgroundColor: colors.surface}]}>
              <Text size="small" style={styles.quoteText}>
                "Resume mein chahte ho shaan, Studifysuccess se internships
                karo, ban jao mahan! 💼✨"
              </Text>
            </Card>

            <View style={styles.categoryGrid}>
              {categoriesList.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleCategoryPress(item)}
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
                    {item.badge && (
                      <View style={styles.badgeContainer}>
                        <Text size="small" style={styles.badgeText}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
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

          {/* 5. SALES INTERNSHIP CARD */}
          <Card style={[styles.salesCard, {backgroundColor: colors.surface}]}>
            <Text
              size="medium"
              style={[styles.salesTitle, {color: colors.onSurface}]}>
              Sales Internship Program
            </Text>
            <Text
              size="small"
              style={{
                color: colors.primary,
                fontSize: 11.5,
                fontWeight: 'bold',
              }}>
              by Studifysuccess
            </Text>
            <Text
              size="small"
              style={{color: colors.outline, fontSize: 11.5, marginBottom: 8}}>
              In collaboration with WebBrandBuilders
            </Text>

            <View style={styles.commissionBadge}>
              <Text size="small" style={styles.commissionText}>
                High Earning Potential 💸
              </Text>
            </View>

            <Text
              size="small"
              style={{
                color: colors.onSurfaceVariant,
                fontSize: 12.5,
                marginVertical: 10,
                lineHeight: 18,
              }}>
              Kickstart your career with real sales experience. Learn lead
              generation, pitching, and closing deals while earning attractive
              commissions.
            </Text>

            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Icon name="check-circle" size={16} color="#25D366" />
                <Text size="small" style={styles.bulletText}>
                  Work on real client projects
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Icon name="check-circle" size={16} color="#25D366" />
                <Text size="small" style={styles.bulletText}>
                  20% commission per lead
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Icon name="check-circle" size={16} color="#25D366" />
                <Text size="small" style={styles.bulletText}>
                  Flexible work opportunity
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Icon name="check-circle" size={16} color="#25D366" />
                <Text size="small" style={styles.bulletText}>
                  Performance-based incentives
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Icon name="check-circle" size={16} color="#25D366" />
                <Text size="small" style={styles.bulletText}>
                  Certificate + PPO opportunity
                </Text>
              </View>
            </View>

            <View style={styles.payBox}>
              <Text
                size="medium"
                style={{fontWeight: 'bold', color: colors.primary}}>
                Earn ₹10,000 – ₹20,000+
              </Text>
              <Text
                size="small"
                style={{
                  color: colors.outline,
                  fontSize: 9,
                  fontWeight: 'bold',
                }}>
                Monthly Performance Pay
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                openLink('https://webbrandbuilders.com/careers/', 'Apply Sales')
              }
              style={[styles.applyBtn, {backgroundColor: colors.primary}]}>
              <Text size="small" style={styles.applyBtnText}>
                Apply via Studifysuccess 🚀
              </Text>
            </TouchableOpacity>
          </Card>

          {/* 6. PLACEMENT GUIDANCE */}
          <Card
            style={[styles.placementCard, {backgroundColor: colors.surface}]}>
            <Image
              source={{uri: 'https://www.studifysuccess.com/images/pg.webp'}}
              style={styles.placementImage}
              resizeMode="contain"
            />
            <Text
              size="medium"
              style={[styles.placementTitle, {color: colors.onSurface}]}>
              Placement Guidance
            </Text>
            <Text
              size="small"
              style={{color: colors.outline, marginBottom: 15}}>
              For Jobs & Internship Guidance
            </Text>
            <TouchableOpacity
              onPress={() =>
                openLink(
                  'https://careers.studifysuccess.com/placement-guidance',
                  'Placement Guidance',
                )
              }
              style={[styles.placementBtn, {backgroundColor: colors.primary}]}>
              <Text size="small" style={styles.placementBtnText}>
                Register Now
              </Text>
            </TouchableOpacity>
          </Card>

          {/* 7. FUTURE JOBS (DROP RESUME) */}
          <Card style={[styles.futureCard, {backgroundColor: colors.primary}]}>
            <Text size="medium" style={styles.futureTitleText}>
              Don't want to do internship?
            </Text>
            <Text size="small" style={styles.futureDescText}>
              Your profile will be taken into consideration for upcoming job
              opportunities.
            </Text>
            <TouchableOpacity
              onPress={handleDropResume}
              style={styles.dropResumeBtn}>
              <Icon name="arrow-up-circle" size={16} color={colors.primary} />
              <Text
                size="small"
                style={[styles.dropResumeBtnText, {color: colors.primary}]}>
                {' '}
                Drop Resume
              </Text>
            </TouchableOpacity>
          </Card>
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
    fontSize: 11,
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
  heroImage: {
    width: 100,
    height: 120,
    zIndex: 1,
  },
  bannerBottomLinks: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#eaeaea',
    paddingVertical: 10,
    backgroundColor: '#fafafa',
  },
  bottomLinkItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bottomLinkText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    marginBottom: 15,
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
  quoteCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: '#eaeaea',
  },
  quoteText: {
    color: '#2e7d32',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 11.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 15,
  },
  categoryItem: {
    width: (width - 80) / 3,
    borderRadius: 15,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaeaea',
    elevation: 1,
    marginVertical: 4,
  },
  imageWrapper: {
    width: 44,
    height: 44,
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
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  categoryLabel: {
    fontSize: 9.5,
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 12,
  },
  salesCard: {
    borderRadius: 16,
    padding: 15,
    elevation: 2,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  salesTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  commissionBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginVertical: 5,
  },
  commissionText: {
    color: '#2e7d32',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bulletList: {
    marginVertical: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  bulletText: {
    fontSize: 12,
  },
  payBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 0.5,
    borderColor: '#eaeaea',
  },
  applyBtn: {
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  placementCard: {
    borderRadius: 16,
    padding: 15,
    elevation: 2,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  placementImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  placementTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 5,
  },
  placementBtn: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placementBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  futureCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  futureTitleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  futureDescText: {
    color: '#e3f2fd',
    fontSize: 11.5,
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 16,
  },
  dropResumeBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropResumeBtnText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default Careers;
