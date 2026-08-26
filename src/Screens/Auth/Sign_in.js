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
} from 'react-native';
import {Text} from '../../Components/Input';
import {useDispatch} from 'react-redux';
import {setUserLogin} from '../../Redux/Slices/InitialSlice';
import useApi from '../../Components/Api/Api';
import {useMutation} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Google from './Google';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import FlashMessage from '../../Components/Screen/FlashMessage';

const {width, height} = Dimensions.get('window');

// Sleek, minimal custom input component with animated bottom border
const MinimalInput = ({ label, icon, secureTextEntry, value, onChangeText, error, keyboardType }) => {
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

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: error ? '#FF3B30' : (isFocused ? '#D81B60' : '#888') }]}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        <Icon name={icon} size={20} color={isFocused ? '#D81B60' : '#888'} style={styles.inputIcon} />
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

const Sign_in = ({navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState('student');
  const [tlAccessCode, setTlAccessCode] = useState('');
  const [tlAccessError, setTlAccessError] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: false,
    password: false,
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

  const updateFormValue = useCallback((name, value) => {
    setForm(prev => ({...prev, [name]: value}));
    setErrors(prev => ({...prev, [name]: false}));
  }, []);

  const {mutate, isPending} = useMutation({
    mutationFn: data => useApi().post('/auth', data),
    onSuccess: async res => {
      if (res.message) {
        navigation.navigate('Otp', {email: form.email.trim().toLowerCase(), type: 1});
        return;
      }
      const cleanEmail = (form.email || res.data?.user?.email || '').trim().toLowerCase();
      
      // Trust backend verified user role flags
      const isTl = res.data?.user?.is_tl === 1 || res.data?.user?.is_tl === true;
      const isIntern = res.data?.user?.is_intern === 1 || res.data?.user?.is_intern === true;
      const finalRole = isTl ? 'tl' : (isIntern ? 'intern' : 'student');
      
      if (cleanEmail) {
        await AsyncStorage.setItem(`@studify_role_${cleanEmail}`, finalRole);
      }

      const updatedUser = {
        ...res.data.user,
        is_intern: finalRole === 'intern',
        is_tl: finalRole === 'tl',
      };
      dispatch(
        setUserLogin({
          token: res.data.token,
          user: updatedUser,
        }),
      );
    },
    onError: error => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Something went wrong during sign-in';
      FlashMessage({
        message: errorMsg,
        type: 'danger',
      });
    }
  });

  const handleSubmit = useCallback(async () => {
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

    setErrors(newErrors);

    if (!Object.values(newErrors).some(error => error)) {
      try {
        mutate({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: selectedRole,
        });
      } catch (error) {}
    }
  }, [form, mutate, selectedRole]);

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
          contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Magazine-style Header */}
          <View style={styles.headerContainer}>
            <StaggeredEntrance delay={100} index={0}>
              <Text style={styles.hugeTitle}>Hello.</Text>
            </StaggeredEntrance>
            <StaggeredEntrance delay={100} index={1}>
              <Text style={styles.subtitle}>Welcome back, you've been missed!</Text>
            </StaggeredEntrance>
          </View>

          <StaggeredEntrance delay={100} index={1.5}>
            <View style={styles.roleSelectorContainer}>
              <Pressable
                style={[
                  styles.roleTab,
                  selectedRole === 'student' && styles.activeRoleTab,
                ]}
                onPress={() => setSelectedRole('student')}
              >
                <Icon
                  name="book-open"
                  size={18}
                  color={selectedRole === 'student' ? '#FFF' : '#666'}
                  style={{marginRight: 8}}
                />
                <Text
                  style={[
                    styles.roleTabText,
                    selectedRole === 'student' && styles.activeRoleTabText,
                  ]}
                >
                  Student
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.roleTab,
                  selectedRole === 'intern' && styles.activeRoleTab,
                ]}
                onPress={() => setSelectedRole('intern')}
              >
                <Icon
                  name="briefcase"
                  size={18}
                  color={selectedRole === 'intern' ? '#FFF' : '#666'}
                  style={{marginRight: 8}}
                />
                <Text
                  style={[
                    styles.roleTabText,
                    selectedRole === 'intern' && styles.activeRoleTabText,
                  ]}
                >
                  Intern
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.roleTab,
                  selectedRole === 'tl' && styles.activeRoleTab,
                ]}
                onPress={() => setSelectedRole('tl')}
              >
                <Icon
                  name="award"
                  size={18}
                  color={selectedRole === 'tl' ? '#FFF' : '#666'}
                  style={{marginRight: 8}}
                />
                <Text
                  style={[
                    styles.roleTabText,
                    selectedRole === 'tl' && styles.activeRoleTabText,
                  ]}
                >
                  TL
                </Text>
              </Pressable>
            </View>
          </StaggeredEntrance>

          <View style={styles.formContainer}>
            {selectedRole === 'tl' && (
              <StaggeredEntrance delay={100} index={1.6}>
                <MinimalInput 
                  label="TL Access Security Code" 
                  icon="lock" 
                  value={tlAccessCode} 
                  onChangeText={(text) => {
                    setTlAccessCode(text);
                    if (text === 'TL@STUDIFY2026') {
                      setTlAccessError(false);
                    } else if (text.length >= 'TL@STUDIFY2026'.length) {
                      setTlAccessError(true);
                    }
                  }} 
                  error={tlAccessError}
                  secureTextEntry
                />
              </StaggeredEntrance>
            )}

            {(selectedRole !== 'tl' || tlAccessCode === 'TL@STUDIFY2026') ? (
              <>
                <StaggeredEntrance delay={100} index={2}>
                  <MinimalInput 
                    label="Email Address" 
                    icon="mail" 
                    value={form.email} 
                    onChangeText={(text) => updateFormValue('email', text)} 
                    error={errors.email}
                    keyboardType="email-address"
                  />
                </StaggeredEntrance>

                <StaggeredEntrance delay={100} index={3}>
                  <MinimalInput 
                    label="Password" 
                    icon="lock" 
                    secureTextEntry 
                    value={form.password} 
                    onChangeText={(text) => updateFormValue('password', text)} 
                    error={errors.password}
                  />
                </StaggeredEntrance>

                <StaggeredEntrance delay={100} index={4}>
                  <View style={styles.forgotPasswordContainer}>
                    <Pressable onPress={() => navigation.navigate('ForgetPassword')}>
                      <Text style={styles.linkText}>Forgot Password?</Text>
                    </Pressable>
                  </View>
                </StaggeredEntrance>
                
                <StaggeredEntrance delay={100} index={5}>
                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <Pressable 
                      onPressIn={handlePressIn} 
                      onPressOut={handlePressOut}
                      onPress={handleSubmit} 
                      style={styles.pillButton}
                    >
                      <Text style={styles.pillButtonText}>{isPending ? 'Signing in...' : 'Sign In'}</Text>
                      <Icon name="arrow-right" size={24} color="#FFF" />
                    </Pressable>
                  </Animated.View>
                </StaggeredEntrance>
                
                <StaggeredEntrance delay={100} index={6}>
                  <Google selectedRole={selectedRole} />
                </StaggeredEntrance>

                <StaggeredEntrance delay={100} index={7}>
                  <View style={styles.signupContainer}>
                    <Pressable style={styles.signupPressable} onPress={() => navigation.navigate('Signup', {role: selectedRole, code: tlAccessCode})}>
                      <Text style={styles.signupText}>Don't have an account? </Text>
                      <Text style={styles.signupTextBold}>Sign up</Text>
                    </Pressable>
                  </View>
                </StaggeredEntrance>
              </>
            ) : (
              selectedRole === 'tl' && tlAccessCode.length > 0 && tlAccessCode !== 'TL@STUDIFY2026' && (
                <Text style={{color: '#FF3B30', textAlign: 'center', marginTop: 10, fontWeight: '600'}}>
                  Please enter the correct TL Access Code to proceed
                </Text>
              )
            )}
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
    marginBottom: 50,
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
    marginBottom: 30,
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
    padding: 0, // override default padding
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 40,
    marginTop: -10,
  },
  linkText: {
    color: '#D81B60', 
    fontWeight: '600',
    fontSize: 15,
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
    marginBottom: 20,
  },
  pillButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  signupContainer: {
    marginTop: 30,
    alignSelf: 'center',
  },
  signupPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 15,
  },
  signupTextBold: {
    color: '#D81B60',
    fontWeight: 'bold',
    fontSize: 15,
  },
  roleSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    padding: 4,
    marginBottom: 35,
    marginTop: -20,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  activeRoleTab: {
    backgroundColor: '#D81B60',
    shadowColor: '#D81B60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  roleTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeRoleTabText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default Sign_in;
