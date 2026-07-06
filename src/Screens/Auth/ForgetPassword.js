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
import useApi from '../../Components/Api/Api';
import {useMutation} from '@tanstack/react-query';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

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

const ForgetPassword = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState(false);

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

  const updateFormValue = useCallback((text) => {
    setEmail(text);
    setErrors(false);
  }, []);

  const {mutate, isPending} = useMutation({
    mutationFn: () => useApi().post('/auth/sendOtp', {email: email}),
    onSuccess: res => {
      // res.status won't exist if the backend simply returned { message: "OTP sent" }. So we can check for success based on whether an error was thrown or not.
      if (res && res.message && !res.message.toLowerCase().includes('cannot read property')) {
          navigation.replace('Otp', {email: email, type: 0});
      } else if (res && res.status === 200) {
          navigation.replace('Otp', {email: email, type: 0});
      }
    },
  });

  const handleSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return setErrors(true);
    }
    mutate();
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
          contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Magazine-style Header */}
          <View style={styles.headerContainer}>
            <StaggeredEntrance delay={100} index={0}>
              <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="arrow-left" size={24} color="#111" />
              </Pressable>
            </StaggeredEntrance>
            <StaggeredEntrance delay={100} index={1}>
              <Text style={styles.hugeTitle}>Recovery.</Text>
            </StaggeredEntrance>
            <StaggeredEntrance delay={100} index={2}>
              <Text style={styles.subtitle}>Enter your email address to receive an OTP to reset your password.</Text>
            </StaggeredEntrance>
          </View>

          <View style={styles.formContainer}>
            <StaggeredEntrance delay={100} index={3}>
              <MinimalInput 
                label="Email Address" 
                icon="mail" 
                value={email} 
                onChangeText={updateFormValue} 
                error={errors}
                keyboardType="email-address"
              />
            </StaggeredEntrance>
            
            <StaggeredEntrance delay={100} index={4}>
              <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 20 }}>
                <Pressable 
                  onPressIn={handlePressIn} 
                  onPressOut={handlePressOut}
                  onPress={handleSubmit} 
                  style={styles.pillButton}
                >
                  <Text style={styles.pillButtonText}>{isPending ? 'Sending OTP...' : 'Send OTP'}</Text>
                  <Icon name="arrow-right" size={24} color="#FFF" />
                </Pressable>
              </Animated.View>
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
    marginBottom: 50,
  },
  backButton: {
    marginBottom: 20,
    padding: 10,
    marginLeft: -10,
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
    marginTop: 10,
    fontWeight: '500',
    lineHeight: 24,
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
    marginBottom: 20,
  },
  pillButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default ForgetPassword;
