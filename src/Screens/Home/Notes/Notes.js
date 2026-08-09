import React, {useState, useEffect} from 'react';
import {Screen, BouncyButton} from '../../../Components/Screen';
import {Text} from '../../../Components/Input';
import {StyleSheet, View, Modal, TouchableOpacity, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';
import RazorpayCheckout from 'react-native-razorpay';
import {useSelector} from 'react-redux';
import useApi from '../../../Components/Api/Api';

const PRICE = 99;
const RAZORPAY_KEY = 'rzp_test_TNciL5Zn3FHf5v'; // User's active test key

const Notes = ({navigation}) => {
  const {colors, dark} = useTheme();
  const {user} = useSelector(state => state.initial);
  const {get, post} = useApi();

  const [unlockedKeys, setUnlockedKeys] = useState([]);
  const [paywallItem, setPaywallItem] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await get('/payment/my-purchases', {skipSuccessFlash: true, skipErrorFlash: true});
        if (res && res.data && res.data.unlockedKeys) {
          setUnlockedKeys(res.data.unlockedKeys);
        }
      } catch (e) {}
    };
    fetchPurchases();
  }, []);

  const LOCKED_ITEMS = ['lectures', 'ncert_solutions', 'chapter_wise_notes', 'combo_study_notes'];

  const noteTypes = [
    {
      title: 'YouTube Notes',
      descWords: [
        {text: 'High-quality ', highlight: false},
        {text: 'video-mapped ', highlight: true},
        {text: 'study notes.', highlight: false},
      ],
      url: 'FreeNotes',
      isStack: true,
      color: dark ? 'rgba(198, 40, 40, 0.12)' : '#ffebee',
      borderColor: '#c62828',
      icon: 'youtube',
      badge: 'FREE',
      category: 'free',
      actionText: 'Watch & Learn',
    },
    {
      title: 'Lectures',
      descWords: [
        {text: 'High-quality ', highlight: false},
        {text: 'video lectures ', highlight: true},
        {text: 'for class chapters.', highlight: false},
      ],
      url: 'Lectures',
      isStack: true,
      color: dark ? 'rgba(74, 20, 140, 0.12)' : '#f3e5f5',
      borderColor: '#4a148c',
      icon: 'video-outline',
      badge: 'PAID',
      category: 'paid',
      itemKey: 'lectures',
      actionText: 'Watch Lectures',
    },
    {
      title: 'NCERT Solutions',
      descWords: [
        {text: 'Step-by-step ', highlight: false},
        {text: 'solutions ', highlight: true},
        {text: 'for all subjects.', highlight: false},
      ],
      url: 'NcertSolutions',
      isStack: true,
      color: dark ? 'rgba(0, 150, 136, 0.12)' : '#e0f2f1',
      borderColor: '#00897b',
      icon: 'notebook-check-outline',
      badge: 'PAID',
      category: 'paid',
      itemKey: 'ncert_solutions',
      actionText: 'View Solutions',
    },
    {
      title: 'Important Questions',
      descWords: [
        {text: 'Handpicked ', highlight: false},
        {text: 'exam-critical ', highlight: true},
        {text: 'questions.', highlight: false},
      ],
      url: 'ImportantQuestions',
      isStack: true,
      color: dark ? 'rgba(63, 81, 181, 0.12)' : '#e8eaf6',
      borderColor: '#3f51b5',
      icon: 'file-question-outline',
      badge: 'IMP Q',
      category: 'free',
      actionText: 'View Questions',
    },
    {
      title: 'Online Quiz',
      descWords: [
        {text: 'Interactive ', highlight: false},
        {text: 'practice tests ', highlight: true},
        {text: '& quizzes.', highlight: false},
      ],
      url: 'OnlineQuiz',
      isStack: true,
      color: dark ? 'rgba(156, 39, 176, 0.12)' : '#f3e5f5',
      borderColor: '#9c27b0',
      icon: 'chat-question-outline',
      badge: 'QUIZ',
      category: 'free',
      actionText: 'Start Quiz',
    },
    {
      title: 'Download Notes',
      descWords: [
        {text: 'Free ', highlight: true},
        {text: 'study materials!', highlight: false},
      ],
      url: 'ClassNotesSelector',
      isStack: true,
      color: dark ? 'rgba(0, 150, 136, 0.12)' : '#e0f2f1',
      borderColor: '#009688',
      icon: 'download',
      badge: 'NOTES',
      category: 'free',
      actionText: 'Select Class',
    },
    {
      title: 'Science Keywords',
      descWords: [
        {text: 'Key ', highlight: false},
        {text: 'science definitions ', highlight: true},
        {text: 'for quick study.', highlight: false},
      ],
      url: 'Keywords',
      isStack: true,
      color: dark ? 'rgba(76, 175, 80, 0.12)' : '#e8f5e9',
      borderColor: '#4caf50',
      icon: 'key-variant',
      badge: 'KEYWORDS',
      category: 'free',
      actionText: 'View Keywords',
    },
    {
      title: 'Chapter-Wise Notes',
      descWords: [
        {text: 'Comprehensive ', highlight: false},
        {text: 'chapter-wise ', highlight: true},
        {text: 'reference guides.', highlight: false},
      ],
      url: 'https://allstudynotes.studifysuccess.com/select-class-chapter?mobile=true',
      isStack: false,
      color: dark ? 'rgba(233, 30, 99, 0.12)' : '#fce4ec',
      borderColor: '#e91e63',
      icon: 'file-document-multiple-outline',
      badge: 'PAID',
      category: 'paid',
      itemKey: 'chapter_wise_notes',
      actionText: 'Access Chapters',
    },
    {
      title: 'Combo Study Notes',
      descWords: [
        {text: 'Complete ', highlight: false},
        {text: 'revision package ', highlight: true},
        {text: '& summaries.', highlight: false},
      ],
      url: 'https://allstudynotes.studifysuccess.com/select-class-subject?mobile=true',
      isStack: false,
      color: dark ? 'rgba(230, 81, 0, 0.12)' : '#fff3e0',
      borderColor: '#e65100',
      icon: 'book-open-page-variant',
      badge: 'PAID',
      category: 'paid',
      itemKey: 'combo_study_notes',
      actionText: 'Get Combo',
    },
  ];

  const openRazorPay = (item) => {
    if (!RazorpayCheckout || !RazorpayCheckout.open) {
      Alert.alert('RazorPay Error', 'RazorPay SDK module is not linked or initialized correctly in the app build.');
      return;
    }
    setPaying(true);
    try {
      const options = {
        name: 'StudifySuccess',
        description: item.title,
        image: 'https://www.studifysuccess.com/images//apple-touch-icon.webp',
        currency: 'INR',
        key: RAZORPAY_KEY,
        amount: PRICE * 100,
        prefill: {
          email: (user && user.email) || '',
          contact: (user && user.phone && user.phone.length === 10) ? user.phone : '',
        },
        theme: {color: '#008b8b'},
      };

      RazorpayCheckout.open(options)
      .then(async (e) => {
        try {
          await post('/payment/unlock-item', {
            item_key: item.itemKey,
            title: item.title,
            amount: PRICE,
            payment_id: e.razorpay_payment_id,
          });
          setUnlockedKeys(prev => [...prev, item.itemKey]);
          setPaywallItem(null);
          if (item.isStack) {
            navigation.navigate(item.url);
          } else {
            navigation.navigate('WebView', {url: item.url});
          }
        } catch (err) {
          Alert.alert('Unlock Error', err.message || 'Payment succeeded but failed to unlock content in database.');
        }
      })
      .catch((error) => {
        Alert.alert('Payment Cancelled/Failed', error.description || error.message || 'The checkout sheet closed.');
      })
      .finally(() => setPaying(false));
    } catch (err) {
      Alert.alert('Checkout Launch Error', err.message || 'An error occurred while launching RazorPay.');
      setPaying(false);
    }
  };

  const handlePress = item => {
    if (item.itemKey && !unlockedKeys.includes(item.itemKey)) {
      setPaywallItem(item);
      return;
    }
    if (item.isStack) {
      navigation.navigate(item.url);
    } else {
      navigation.navigate('WebView', {url: item.url});
    }
  };

  const renderCard = (item, index) => (
    <BouncyButton
      key={index}
      onPress={() => handlePress(item)}
      style={[
        styles.bannerCard,
        {
          backgroundColor: dark ? colors.surface : item.color,
          borderColor: dark
            ? colors.outlineVariant
            : item.borderColor + '33' || '#eceff1',
        },
      ]}>
      <View style={styles.bannerTextContainer}>
        <Text
          style={[
            styles.bannerCardTitle,
            {color: dark ? '#ffffff' : '#263238'},
          ]}>
          {item.title}
        </Text>
        <Text
          style={[
            styles.bannerCardDesc,
            {color: dark ? '#b0bec5' : '#546e7a'},
          ]}>
          {item.descWords.map((word, idx) => (
            <Text
              key={idx}
              style={
                word.highlight && {
                  color: item.borderColor,
                  fontWeight: 'bold',
                }
              }>
              {word.text}
            </Text>
          ))}
        </Text>
        <View style={[styles.bannerBtn, {backgroundColor: item.borderColor}]}>
          <Text style={styles.bannerBtnText}>
            {item.actionText || 'Access'}
          </Text>
          <Icon
            name={item.isStack ? 'chevron-right' : 'open-in-new'}
            size={14}
            color="#ffffff"
            style={styles.btnIcon}
          />
        </View>
      </View>
      <View
        style={[
          styles.bannerIconCircle,
          {
            backgroundColor: dark
              ? item.borderColor + '22'
              : item.borderColor + '15' || '#f5f5f5',
          },
        ]}>
        <Icon name={item.icon} size={36} color={item.borderColor} />
      </View>
      {item.badge && (
        <View style={[styles.gridBadge, {backgroundColor: item.borderColor}]}>
          <Text style={styles.gridBadgeText}>{item.badge}</Text>
        </View>
      )}
    </BouncyButton>
  );

  const freeItems = noteTypes.filter(item => item.category === 'free');
  const paidItems = noteTypes.filter(item => item.category === 'paid');

  return (
    <Screen NoHeader>
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

      {/* Paywall Modal */}
      <Modal
        visible={paywallItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPaywallItem(null)}>
        <View style={styles.paywallOverlay}>
          <View style={styles.paywallCard}>
            <TouchableOpacity style={styles.paywallClose} onPress={() => setPaywallItem(null)}>
              <Icon name="close" size={22} color="#555" />
            </TouchableOpacity>
            <View style={styles.paywallLockCircle}>
              <Icon name="lock" size={36} color="#e91e63" />
            </View>
            <Text style={styles.paywallTitle}>Premium Content</Text>
            <Text style={styles.paywallItemName}>{paywallItem && paywallItem.title}</Text>
            <Text style={styles.paywallDesc}>Unlock lifetime access to this content with a one-time payment.</Text>
            <View style={styles.paywallPriceRow}>
              <Text style={styles.paywallPrice}>₹99</Text>
              <Text style={styles.paywallPriceLabel}>  One-time</Text>
            </View>
            <TouchableOpacity
              style={[styles.paywallBtn, paying && {opacity: 0.6}]}
              onPress={() => paywallItem && openRazorPay(paywallItem)}
              disabled={paying}>
              <Icon name="credit-card-outline" size={18} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.paywallBtnText}>{paying ? 'Processing...' : 'Pay ₹99 & Unlock'}</Text>
            </TouchableOpacity>
            <Text style={styles.paywallSecure}>🔒 Secured by RazorPay · GPay · UPI · Cards</Text>
          </View>
        </View>
      </Modal>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 12,
  },
  list: {
    gap: 12,
    marginBottom: 20,
  },
  bannerCard: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    position: 'relative',
  },
  bannerTextContainer: {
    flex: 1.3,
    justifyContent: 'center',
  },
  bannerCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    marginRight: 64,
  },
  bannerCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  bannerBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 4,
  },
  bannerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  gridBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  gridBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  paywallCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    alignItems: 'center',
    paddingBottom: 40,
  },
  paywallClose: {
    position: 'absolute',
    top: 16,
    right: 20,
    padding: 6,
  },
  paywallLockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fce4ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  paywallTitle: {
    fontSize: 13,
    color: '#e91e63',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  paywallItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1d1d',
    marginBottom: 10,
    textAlign: 'center',
  },
  paywallDesc: {
    fontSize: 13,
    color: '#546e7a',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  paywallPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 22,
  },
  paywallPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1d1d',
  },
  paywallPriceLabel: {
    fontSize: 14,
    color: '#546e7a',
  },
  paywallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008b8b',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 3,
    marginBottom: 16,
  },
  paywallBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paywallSecure: {
    fontSize: 11,
    color: '#90a4ae',
    textAlign: 'center',
  },
});

export default Notes;
