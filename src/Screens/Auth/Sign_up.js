import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  TextInput as RNTextInput,
  Linking,
  Keyboard,
} from 'react-native';
import {Text} from '../../Components/Input';
import useApi from '../../Components/Api/Api';
import {useMutation} from '@tanstack/react-query';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import FlashMessage from '../../Components/Screen/FlashMessage';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import DropDown from 'react-native-paper-dropdown';
import {useTheme} from 'react-native-paper';

const {width, height} = Dimensions.get('window');

// Sleek, minimal custom input component with animated bottom border
const MinimalInput = ({ label, icon, secureTextEntry, value, onChangeText, error, keyboardType, editable = true, onPress }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? '#FF3B30' : '#E0E0E0', error ? '#FF3B30' : '#D81B60'],
  });

  const content = (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: error ? '#FF3B30' : (isFocused ? '#D81B60' : '#888') }]}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        {icon && <Icon name={icon} size={20} color={isFocused ? '#D81B60' : '#888'} style={styles.inputIcon} />}
        <RNTextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize="none"
          placeholderTextColor="#CCC"
          editable={editable}
          pointerEvents={onPress ? 'none' : 'auto'}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
            <Icon name={isPasswordVisible ? "eye" : "eye-off"} size={20} color="#888" />
          </Pressable>
        )}
      </View>
      <Animated.View style={[styles.inputBorder, { backgroundColor: borderColor }]} />
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
};

// Animated Entrance Wrapper
const StaggeredEntrance = ({ children, delay, index }) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: delay + (index * 100),
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        delay: delay + (index * 100),
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
};

const Sign_up = ({navigation}) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [dropdown, setDropdown] = useState(false);
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    password: '',
    cpassword: '',
    dob: '',
    gender: '',
  });
  const [errors, setErrors] = useState({
    fname: false,
    lname: false,
    email: false,
    phone: false,
    password: false,
    cpassword: false,
    dob: false,
    gender: false,
  });

  // Background floating shapes
  const blob1Y = useRef(new Animated.Value(0)).current;
  const blob2Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(blob1Y, { toValue: -30, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(blob1Y, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(blob2Y, { toValue: 40, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(blob2Y, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();
  }, []);

  const showCalender = () => {
    DateTimePickerAndroid.open({
      value: new Date(),
      onChange: (e, date) => {
        Keyboard.dismiss();
        if (date) {
            updateFormValue('dob', date.toLocaleDateString('en-GB'));
        }
      },
    });
  };

  const updateFormValue = useCallback((name, value) => {
    setForm(prevForm => ({...prevForm, [name]: value}));
    setErrors(prevErrors => ({...prevErrors, [name]: false}));
  }, []);

  const {mutate, isPending} = useMutation({
    mutationFn: data => useApi().post('/auth/signup', data),
    onSuccess: res => {
      if (res.status === 200)
        navigation.replace('Otp', {email: form.email, type: 1});
    },
  });

  const isGreaterThan5Years = dobString => {
    if (!dobString) return false;
    const parts = dobString.split('/');
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    const dob = new Date(year, month - 1, day); // month is 0-indexed
    return (new Date() - dob) / (1000 * 60 * 60 * 24 * 365.25) > 5;
  };

  const handleSubmit = async () => {
    const newErrors = {};
    Object.keys(form).forEach(key => {
      if (!form[key].trim()) {
        newErrors[key] = true;
      } else {
        newErrors[key] = false;
      }
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    newErrors.email = !emailRegex.test(form.email.trim());

    const phoneRegex = /^[0-9]{10}$/;
    newErrors.phone = !phoneRegex.test(form.phone.trim());
    newErrors.cpassword = form.password !== form.cpassword;
    newErrors.gender = form.gender === '';
    setErrors(newErrors);

    if (!Object.values(newErrors).some(error => error)) {
      if (!isGreaterThan5Years(form.dob)) {
        return FlashMessage({
          message: 'Enter a valid date of birth',
          type: 'danger',
        });
      }
      if (form.gender === '') {
        return FlashMessage({
          message: 'Please select your gender',
          type: 'danger',
        });
      }
      if (form.password.length < 8) {
        return FlashMessage({
          message: 'Password must be at least 8 characters long',
          type: 'danger',
        });
      }
      mutate({
        ...form,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        fname: form.fname.trim(),
        lname: form.lname.trim(),
      });
    }
  };

  const buttonScale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.container}>
      {/* Absolute Decorative Pink Shapes */}
      <Animated.View style={[styles.blob1, { transform: [{ translateY: blob1Y }] }]} />
      <Animated.View style={[styles.blob2, { transform: [{ translateY: blob2Y }] }]} />

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top + 50, paddingBottom: insets.bottom + 40}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <StaggeredEntrance delay={100} index={0}>
              <Text style={styles.hugeTitle}>Join us.</Text>
            </StaggeredEntrance>
            <StaggeredEntrance delay={100} index={1}>
              <Text style={styles.subtitle}>Create your account to get started!</Text>
            </StaggeredEntrance>
          </View>

          <View style={styles.formContainer}>
            <StaggeredEntrance delay={100} index={2}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <View style={{flex: 1, marginRight: 10}}>
                  <MinimalInput 
                    label="First Name" 
                    icon="user" 
                    value={form.fname} 
                    onChangeText={(text) => updateFormValue('fname', text)} 
                    error={errors.fname}
                  />
                </View>
                <View style={{flex: 1, marginLeft: 10}}>
                  <MinimalInput 
                    label="Last Name" 
                    value={form.lname} 
                    onChangeText={(text) => updateFormValue('lname', text)} 
                    error={errors.lname}
                  />
                </View>
              </View>
            </StaggeredEntrance>

            <StaggeredEntrance delay={100} index={3}>
              <MinimalInput 
                label="Email Address" 
                icon="mail" 
                value={form.email} 
                onChangeText={(text) => updateFormValue('email', text)} 
                error={errors.email}
                keyboardType="email-address"
              />
            </StaggeredEntrance>

            <StaggeredEntrance delay={100} index={4}>
              <MinimalInput 
                label="Phone" 
                icon="phone" 
                value={form.phone} 
                onChangeText={(text) => updateFormValue('phone', text)} 
                error={errors.phone}
                keyboardType="number-pad"
              />
            </StaggeredEntrance>

            <StaggeredEntrance delay={100} index={5}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View style={{flex: 1, marginRight: 10}}>
                  <MinimalInput 
                    label="DOB" 
                    icon="calendar" 
                    value={form.dob} 
                    editable={false}
                    onPress={showCalender}
                    error={errors.dob}
                  />
                </View>
                <View style={{flex: 1, marginLeft: 10, marginTop: -20, marginBottom: 10}}>
                  <DropDown
                    label="Gender"
                    mode="outlined"
                    visible={dropdown}
                    showDropDown={() => setDropdown(true)}
                    onDismiss={() => setDropdown(false)}
                    value={form.gender}
                    setValue={value => {
                      updateFormValue('gender', value);
                    }}
                    list={[
                      {label: 'Male', value: 'Male'},
                      {label: 'Female', value: 'Female'},
                      {label: 'Other', value: 'Other'},
                    ]}
                    dropDownItemTextStyle={{color: colors.onBackground}}
                    error={errors.gender}
                  />
                </View>
              </View>
            </StaggeredEntrance>

            <StaggeredEntrance delay={100} index={6}>
              <MinimalInput 
                label="Password" 
                icon="lock" 
                secureTextEntry 
                value={form.password} 
                onChangeText={(text) => updateFormValue('password', text)} 
                error={errors.password}
              />
            </StaggeredEntrance>

            <StaggeredEntrance delay={100} index={7}>
              <MinimalInput 
                label="Confirm Password" 
                icon="check-circle" 
                secureTextEntry 
                value={form.cpassword} 
                onChangeText={(text) => updateFormValue('cpassword', text)} 
                error={errors.cpassword}
              />
            </StaggeredEntrance>
            
            <StaggeredEntrance delay={100} index={8}>
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>By signing up, you agree to our </Text>
                <View style={{flexDirection: 'row'}}>
                  <Pressable onPress={() => Linking.openURL('https://www.studifysuccess.com/terms-conditions')}>
                    <Text style={styles.linkText}>Terms & Conditions</Text>
                  </Pressable>
                  <Text style={styles.termsText}> and </Text>
                  <Pressable onPress={() => Linking.openURL('https://www.studifysuccess.com/privacy-policy')}>
                    <Text style={styles.linkText}>Privacy Policy</Text>
                  </Pressable>
                </View>
              </View>
            </StaggeredEntrance>

            <StaggeredEntrance delay={100} index={9}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <Pressable 
                  onPressIn={handlePressIn} 
                  onPressOut={handlePressOut}
                  onPress={handleSubmit} 
                  style={styles.pillButton}
                >
                  <Text style={styles.pillButtonText}>{isPending ? 'Signing up...' : 'Sign Up'}</Text>
                  <Icon name="arrow-right" size={24} color="#FFF" />
                </Pressable>
              </Animated.View>
            </StaggeredEntrance>

            <StaggeredEntrance delay={100} index={10}>
              <View style={styles.signinContainer}>
                <Pressable style={styles.signinPressable} onPress={() => navigation.goBack()}>
                  <Text style={styles.signinText}>Already have an account? </Text>
                  <Text style={styles.signinTextBold}>Sign in</Text>
                </Pressable>
              </View>
            </StaggeredEntrance>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', 
  },
  blob1: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#FFE4E1',
    opacity: 0.8,
  },
  blob2: {
    position: 'absolute',
    bottom: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: '#FFC0CB',
    opacity: 0.4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
  },
  headerContainer: {
    marginBottom: 40,
  },
  hugeTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  inputIcon: {
    marginRight: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    padding: 0,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eyeIcon: {
    padding: 5,
  },
  inputBorder: {
    height: 2,
    width: '100%',
    borderRadius: 2,
  },
  pillButton: {
    backgroundColor: '#D81B60',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#D81B60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  pillButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  signinContainer: {
    marginTop: 10,
    alignSelf: 'center',
  },
  signinPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signinText: {
    color: '#666',
    fontSize: 15,
  },
  signinTextBold: {
    color: '#D81B60',
    fontWeight: 'bold',
    fontSize: 15,
  },
  termsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  termsText: {
    color: '#666',
    fontSize: 13,
  },
  linkText: {
    color: '#D81B60',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default Sign_up;
