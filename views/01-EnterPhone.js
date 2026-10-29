import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Keyboard,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import ReactNativePhoneInput from 'react-native-phone-input';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faArrowLeft, faMobileScreen } from '@fortawesome/free-solid-svg-icons';
import OtpInputField from '../components/OtpInputField';
import { useFonts } from 'expo-font';
import config from '../views/config';
import NavigationContext from '../context/NavigationContext';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { jwtDecode } from 'jwt-decode';
import { completeUserSocialAuth } from '../utils/userSocialAuth';
import { tryGetDevicePhoneNumber } from '../utils/devicePhoneNumber';
import { normalizePhoneNumber } from '../utils/phoneNumber';

WebBrowser.maybeCompleteAuthSession();

export default function EnterPhone({ navigation, route }) {
  const { setUserLoggedIn, setUserRole, setAppMode } = useContext(NavigationContext);
  const startPhoneAuth = Boolean(route?.params?.startPhoneAuth);

  const [googleRequest, googleResponse, promptGoogleAuth] = Google.useAuthRequest({
    expoClientId: config.googleExpoClientId,
    iosClientId: config.googleIosClientId,
    androidClientId: config.googleAndroidClientId,
    webClientId: config.googleWebClientId,
    scopes: ['profile', 'email'],
  });

  // methods | phoneForm | otp
  const [viewMode, setViewMode] = useState('methods');
  // fast = phone auth → login or SocialSignup; email = classic AuthStack
  const [flowType, setFlowType] = useState('email');
  const [openedFromSignIn, setOpenedFromSignIn] = useState(startPhoneAuth);

  const [mobile, setMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isPinReady, setIsPinReady] = useState(false);
  const maximumCodeLength = 6;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [socialError, setSocialError] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const phoneInputRef = useRef();
  const codeInputRef = useRef();
  const verificationCodeRef = useRef(null);

  const makeVerificationCode = () => Math.floor(100000 + Math.random() * 900000);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleAuthSuccess();
    }
  }, [googleResponse]);

  useEffect(() => {
    if (startPhoneAuth) {
      setOpenedFromSignIn(true);
      handlePhoneFastSignup();
      // Clear param so back/remount doesn't loop if user cancels
      navigation.setParams?.({ startPhoneAuth: false });
    }
  }, [startPhoneAuth]);

  const normalizePhone = (value) => normalizePhoneNumber(value);

  const openPhoneForm = (nextFlowType) => {
    setFlowType(nextFlowType);
    setError('');
    setSocialError('');
    setViewMode('phoneForm');
  };

  const sendCodeToNumber = async (rawNumber) => {
    const normalized = normalizePhone(rawNumber);
    if (!normalized || normalized.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }

    setError('');
    setLoading(true);
    const code = makeVerificationCode();
    verificationCodeRef.current = code;

    try {
      const response = await fetch(`${config.apiUrl}/users/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: normalized,
          body: `Your Skimatt verification code is ${code}`,
        }),
      });

      if (response.ok) {
        setPhoneNumber(normalized);
        setMobile(normalized);
        setOtpCode(String(code));
        setPinCode('');
        setViewMode('otp');
        setLoading(false);
        alert('Verification code sent successfully!');
        return true;
      }

      const errPayload = await response.json().catch(() => ({}));
      console.error(errPayload);
      alert('An error has occurred!');
      setLoading(false);
      return false;
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert('An error has occurred!');
      return false;
    }
  };

  const handlePhoneFastSignup = async () => {
    setSocialError('');
    setError('');
    setFlowType('fast');

    const detected = await tryGetDevicePhoneNumber();
    if (detected) {
      const ok = await sendCodeToNumber(detected);
      if (ok) return;
    }

    // Failsafe: manual phone entry
    openPhoneForm('fast');
  };

  const handleEmailSignup = () => {
    openPhoneForm('email');
  };

  const sendCode = async () => {
    const number = mobile || phoneInputRef.current?.getValue?.() || '';
    await sendCodeToNumber(number);
  };

  const resendCode = async () => {
    if (!phoneNumber) return;
    await sendCodeToNumber(phoneNumber);
  };

  const finishFastPhoneAuth = async (verifiedPhone) => {
    try {
      setLoading(true);
      const normalized = normalizePhone(verifiedPhone);
      const result = await completeUserSocialAuth({
        provider: 'phone',
        providerId: normalized,
        phoneNumber: normalized,
        navigation,
        setUserLoggedIn,
        setUserRole,
        setAppMode,
        deferSignupNavigation: true,
      });

      // No phone third-party account AND no matching phoneNumber in DB
      if (result.requiresSignup) {
        Alert.alert(
          'No account found',
          'We couldn’t find an account with this phone number. Would you like to create one?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setPinCode('');
                setViewMode(openedFromSignIn ? 'phoneForm' : 'methods');
              },
            },
            {
              text: 'Create account',
              onPress: () => navigation.navigate('SocialSignup', result.signupParams),
            },
          ]
        );
      }
    } catch (e) {
      console.error(e);
      setSocialError(e.message || 'Phone sign in failed');
      setViewMode(openedFromSignIn ? 'phoneForm' : 'methods');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const data = {
      otpCode: otpCode || String(verificationCodeRef.current || ''),
      pinCode: Number(pinCode),
    };

    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/users/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const verifiedPhone = normalizePhone(phoneNumber || mobile);
        setLoading(false);
        alert('Verification Code Approved!');

        if (flowType === 'fast') {
          await finishFastPhoneAuth(verifiedPhone);
        } else {
          navigation.navigate('EnterEmail', { phoneNumber: verifiedPhone });
        }
      } else {
        setLoading(false);
        alert('Wrong Verification Code!');
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleGoogleAuthSuccess = async () => {
    try {
      const accessToken = googleResponse?.authentication?.accessToken;
      if (!accessToken) {
        throw new Error('Google sign-in did not return an access token.');
      }

      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoResponse.json();
      if (!userInfoResponse.ok) {
        throw new Error(userInfo?.error_description || 'Unable to load Google profile.');
      }

      await completeUserSocialAuth({
        provider: 'google',
        providerId: userInfo.sub,
        email: userInfo.email,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        navigation,
        setUserLoggedIn,
        setUserRole,
        setAppMode,
      });
    } catch (e) {
      console.error(e);
      setSocialError(e.message || 'Login failed with Google');
    }
  };

  const handleGoogleLogin = async () => {
    setSocialError('');
    if (
      !config.googleAndroidClientId &&
      !config.googleIosClientId &&
      !config.googleExpoClientId &&
      !config.googleWebClientId
    ) {
      setSocialError('Google sign-in is not configured yet. Add Google client IDs in config.js.');
      return;
    }
    await promptGoogleAuth();
  };

  const handleAppleLogin = async () => {
    try {
      setSocialError('');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const decodedToken = credential.identityToken ? jwtDecode(credential.identityToken) : {};
      await completeUserSocialAuth({
        provider: 'apple',
        providerId: credential.user,
        email: credential.email || decodedToken?.email || '',
        firstName: credential.fullName?.givenName || '',
        lastName: credential.fullName?.familyName || '',
        navigation,
        setUserLoggedIn,
        setUserRole,
        setAppMode,
      });
    } catch (e) {
      console.error('Error during Apple login', e);
      setSocialError(e.message || 'Login failed with Apple');
    }
  };

  const [loaded] = useFonts({
    effortless: require('../assets/fonts/effortless.regular.ttf'),
    aptosDisplayBold: require('../assets/fonts/Aptos-Display-Bold.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const renderBrand = () => (
    <>
      <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
      <MyText title={'Skier'} style={styles.yogi} h3 />
      <MyText title={'guest'} style={styles.teacherStudio} h3 />
    </>
  );

  const renderMethods = () => (
    <View style={styles.enterInfoContainer}>
      <MyText title={'Sign up'} style={styles.h3} h3 />
      <MyText title={'continue with:'} style={styles.socialText} p />
      <View style={styles.socialButtonsContainer}>
        <TouchableOpacity style={styles.socialButton} onPress={handlePhoneFastSignup}>
          <View style={styles.spanSocial}>
            <View style={styles.phoneIconWrap}>
              <FontAwesomeIcon icon={faMobileScreen} size={28} color="#c12818" />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={handleGoogleLogin}
          disabled={!googleRequest}
        >
          <View style={styles.spanSocial}>
            <Image
              style={styles.imgSocial}
              source={require('../img/google-logo-png-open-2000.png')}
            />
          </View>
        </TouchableOpacity>
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin}>
            <View style={styles.spanSocial}>
              <Image
                style={styles.imgSocial}
                source={require('../img/logo-apple-1024.png')}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
      {socialError ? <Text style={styles.socialErrorText}>{socialError}</Text> : null}

      <View style={styles.orContainer}>
        <View style={styles.lineSeparator} />
        <View style={styles.orLabel}>
          <Text>or</Text>
        </View>
        <View style={styles.lineSeparator} />
      </View>

      <TouchableOpacity style={styles.emailSignupButton} onPress={handleEmailSignup}>
        <Text style={styles.emailSignupButtonText}>sign up with email</Text>
      </TouchableOpacity>

      <View style={styles.registrationContainer}>
        <Text style={styles.newUserText}>Already a Skier?</Text>
        <TouchableOpacity
          style={styles.registrationButton}
          onPress={() => navigation.navigate('EnterApp')}
        >
          <Text style={styles.registrationButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.ymIconContainer}>
        <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
      </View>
    </View>
  );

  const renderPhoneForm = () => (
    <View style={styles.enterInfoContainer}>
      <MyText
        title={
          flowType === 'email' ? 'Sign up with email' : 'Continue with phone'
        }
        style={styles.h3}
        h3
      />
      {flowType === 'email' ? (
        <Text style={styles.helperText}>First, verify your phone. Then continue with email.</Text>
      ) : (
        <Text style={styles.helperText}>
          If this number is on an account, we’ll sign you in. If not, you can create one.
        </Text>
      )}

      <ReactNativePhoneInput
        ref={phoneInputRef}
        initialCountry="us"
        initialValue={mobile}
        onChangePhoneNumber={setMobile}
        textProps={{
          placeholder: 'Enter Your Phone Number',
          fontSize: 24,
          fontFamily: 'aptosDisplayBold',
          height: 70,
          width: 300,
          color: '#c12818',
          justifyContent: 'center',
          textContentType: 'telephoneNumber',
          autoComplete: 'tel',
          keyboardType: 'phone-pad',
        }}
        style={styles.phoneInput}
      />

      <Text style={styles.error}>{error}</Text>
      <TouchableOpacity style={styles.button} onPress={sendCode}>
        <View style={styles.firstNextButtonContents}>
          <View />
          <Text style={styles.buttonText}>next</Text>
          <FontAwesomeIcon icon={faArrowRight} size={22} style={styles.arrowIcons} />
        </View>
      </TouchableOpacity>
      <MyText
        title={
          'by proceeding, you consent to get calls, WhatsApp or SMS messages, including by automated means, from skimatt to the number provided'
        }
        style={styles.h4}
        h4
      />
      <TouchableOpacity
        style={styles.backLink}
        onPress={() => {
          setError('');
          if (openedFromSignIn) {
            setOpenedFromSignIn(false);
            navigation.navigate('EnterApp');
            return;
          }
          setViewMode('methods');
        }}
      >
        <View style={styles.buttonContents}>
          <Text style={styles.backLinkText}>
            {openedFromSignIn ? 'Back to sign in' : 'Back to sign up options'}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.ymIconContainer}>
        <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
      </View>
    </View>
  );

  const renderOtp = () => (
    <View style={styles.enterInfoContainer}>
      <View style={styles.codeMessage}>
        <MyText
          title={`Enter the 6-digit code sent to you at:`}
          style={styles.titleMessage}
          h3
        />
        <MyText title={phoneNumber || mobile} style={styles.mobileNumber} />
      </View>

      <Pressable onPress={Keyboard.dismiss}>
        <OtpInputField
          code={pinCode}
          setCode={setPinCode}
          maximumLength={maximumCodeLength}
          setIsPinReady={setIsPinReady}
          style={styles.otpInputField}
        />
      </Pressable>

      <View style={styles.resendCode}>
        <TouchableOpacity onPress={resendCode} style={styles.resendCodeButton}>
          <Text style={styles.resendCodeButtonText}>I did not receive a code</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.navButtonsContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setViewMode('phoneForm');
            setPinCode('');
          }}
        >
          <View style={styles.buttonContents}>
            <FontAwesomeIcon icon={faArrowLeft} size={22} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={verifyCode}>
          <View style={styles.buttonContents}>
            <Text style={styles.buttonText}>next</Text>
            <FontAwesomeIcon icon={faArrowRight} size={22} style={styles.arrowIcons} />
          </View>
        </TouchableOpacity>
      </View>
      {socialError ? <Text style={styles.socialErrorText}>{socialError}</Text> : null}
      <View style={styles.ymIconContainer}>
        <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          if (codeInputRef.current) codeInputRef.current.blur();
        }}
      >
        <View style={styles.container}>
          <View style={styles.titleContainerNum}>
            {renderBrand()}
            {viewMode === 'methods' && renderMethods()}
            {viewMode === 'phoneForm' && renderPhoneForm()}
            {viewMode === 'otp' && renderOtp()}
          </View>
        </View>
      </TouchableWithoutFeedback>
      {isKeyboardVisible && (
        <TouchableOpacity style={styles.buttonContainer} onPress={Keyboard.dismiss} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  skimattLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  container: {
    flex: 1,
    flexGrow: 1,
  },
  titleContainerNum: {
    flex: 1,
    padding: 20,
    backgroundColor: '#c12818',
    justifyContent: 'center',
  },
  h1: {
    fontSize: 55,
    textAlign: 'center',
    color: '#ffebd6',
    marginBottom: 5,
  },
  h3: {
    fontSize: 22,
    textAlign: 'center',
    color: '#c12818',
  },
  yogi: {
    color: '#ffebd6',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'effortless',
    fontSize: 28,
  },
  teacherStudio: {
    color: '#ffebd6',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'effortless',
    fontSize: 18,
  },
  enterInfoContainer: {
    marginTop: 10,
    borderRadius: 30,
    padding: 15,
    backgroundColor: '#ffebd6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  helperText: {
    textAlign: 'center',
    color: '#c12818',
    marginTop: 8,
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  codeMessage: {
    display: 'flex',
  },
  titleMessage: {
    marginVertical: 20,
    fontSize: 20,
    textAlign: 'center',
  },
  h4: {
    marginTop: 20,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 23,
    fontSize: 17.8,
  },
  error: {
    color: '#810101ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  phoneInput: {
    marginTop: 20,
    margin: 10,
    backgroundColor: '#f4835b',
    padding: 20,
    height: 50,
  },
  button: {
    color: '#7F5345',
    backgroundColor: '#f4835b',
    height: 50,
    fontSize: 25,
    fontWeight: '600',
    borderRadius: 50,
  },
  orContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
  },
  lineSeparator: {
    backgroundColor: '#000',
    height: 1,
    width: 100,
    marginVertical: 10,
  },
  orLabel: {
    margin: 0,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  socialButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  socialButton: {
    padding: 10,
    marginTop: 5,
    backgroundColor: 'transparent',
    height: 56,
  },
  socialText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  imgSocial: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
  phoneIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4835b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spanSocial: {
    alignItems: 'center',
    display: 'flex',
  },
  socialErrorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  emailSignupButton: {
    alignSelf: 'center',
    width: '80%',
    borderRadius: 25,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c12818',
    marginTop: 4,
  },
  emailSignupButtonText: {
    color: '#ffebd6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#f4835b',
    height: 50,
    borderRadius: 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backLinkText: {
    color: '#c12818',
    fontSize: 18,
    fontWeight: '600',
  },
  ymIconContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  ymIcon: {
    width: 70,
    height: 70,
  },
  buttonText: {
    margin: 0,
    textAlign: 'center',
    padding: 10,
    fontSize: 25,
    fontWeight: 'normal',
    fontFamily: 'effortless',
  },
  navButtonsContainer: {
    marginTop: 50,
    marginBottom: 40,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  firstNextButtonContents: {
    display: 'flex',
    marginHorizontal: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonContents: {
    display: 'flex',
    marginHorizontal: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: '#f4835b',
    height: 50,
    borderRadius: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    backgroundColor: '#f4835b',
    height: 50,
    borderRadius: 50,
    width: 150,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  mobileNumber: {
    fontSize: 25,
    color: '#01821F',
    textAlign: 'center',
  },
  otpInputField: {
    color: '#941004',
    fontSize: 24,
  },
  resendCode: {
    alignItems: 'flex-start',
    width: 300,
    marginHorizontal: 20,
  },
  resendCodeButton: {
    backgroundColor: '#f4835b',
    height: 30,
    borderRadius: 50,
    marginVertical: 20,
    marginHorizontal: 60,
  },
  resendCodeButtonText: {
    margin: 3,
    textAlign: 'center',
    padding: 5,
    fontSize: 15,
    fontFamily: 'effortless',
  },
  registrationContainer: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newUserText: {
    marginRight: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  registrationButton: {
    width: '50%',
    borderRadius: 25,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#865144ff',
  },
  registrationButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});
