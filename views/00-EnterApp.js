import React, { useContext, useEffect, useState, } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Platform,
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ScrollView, 
  Keyboard, 
  TouchableWithoutFeedback, 
  ActivityIndicator
} from 'react-native';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import { useNavigation } from '@react-navigation/native';
import config from '../views/config';
import { faEye, faEyeSlash, faMobileScreen } from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import NavigationContext from '../context/NavigationContext';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { jwtDecode } from 'jwt-decode';
import { completeUserSocialAuth } from '../utils/userSocialAuth';
import { USER_ROLE, persistAuthRole, APP_MODE } from '../utils/appSession';

const { height, width } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

export default function EnterApp() {

  const navigation = useNavigation();

  const { setUserLoggedIn, setUserRole, setAppMode } = useContext(NavigationContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [socialError, setSocialError] = useState('');

  const [googleRequest, googleResponse, promptGoogleAuth] = Google.useAuthRequest({
    expoClientId: config.googleExpoClientId,
    iosClientId: config.googleIosClientId,
    androidClientId: config.googleAndroidClientId,
    webClientId: config.googleWebClientId,
    scopes: ['profile', 'email'],
  });

  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  useEffect(() => {
    // Check if credentials are stored and retrieve them
    retrieveStoredCredentials();
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleAuthSuccess();
    }
  }, [googleResponse]);

  const retrieveStoredCredentials = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('email');
      const storedPassword = await AsyncStorage.getItem('password');

      if (storedEmail && storedPassword) {
        // Fill email and password fields with stored data
        setEmail(storedEmail);
        setPassword(storedPassword);
      }
    } catch (error) {
      console.error('Error retrieving credentials:', error);
    }
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    setLoginError(null);

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const lowerCaseEmail = email.toLowerCase();

    if (!emailPattern.test(lowerCaseEmail)) {
      setEmailError('Invalid email format');
      return;
    }

    if (!password) {
      setPasswordError('Password cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/users/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: lowerCaseEmail,
          password: password
        })
      });
    
      if (response.status === 200) {

        setLoading(false);
        const respObj = await response.json();
        const { token } = respObj;

        await AsyncStorage.setItem('userToken', token);
        console.log('token saved successfully', token)

        // Step 2: Fetch user data using the token
      const userResponse = await fetch(`${config.apiUrl}/users/get`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      if (userResponse.status === 200) {
        const userData = await userResponse.json();
        console.log('User data fetched:', userData);

        // Validate user data
        if (!userData || !userData._id) {
          console.error('Invalid user data received:', userData);
          setLoginError('Failed to load user data. Please try again.');
          setLoading(false);
          return;
        }

        // Step 3: Store user data in AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        console.log('User data saved to AsyncStorage:', userData);

        await persistAuthRole(USER_ROLE.USER);
        setUserRole?.(USER_ROLE.USER);
        setAppMode?.(APP_MODE.CONSUMER);
        setUserLoggedIn(true);
        // await AsyncStorage.setItem('email', email);
        // await AsyncStorage.setItem('password', password);
        } else {
        console.error('User data fetch failed with status:', userResponse.status);
        setLoginError('Failed to load user data. Please try again.');
        setLoading(false);
      }
      } else if (response.status === 404) {
        setLoading(false); 
        setLoginError('Invalid email or password');
      } else {
        setLoading(false);
        console.error('Login failed - wrong password');
        setLoginError('Entered wrong password!  Please try again.');
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      alert('An error occurred while processing your request');
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  const handleGoogleAuthSuccess = async () => {
    try {
      const accessToken = googleResponse?.authentication?.accessToken;
      if (!accessToken) {
        throw new Error('Google sign-in did not return an access token.');
      }

      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
    } catch (error) {
      console.error(error);
      setSocialError(error.message || 'Login failed with Google');
    }
  };

  const handleGoogleLogin = async () => {
    setSocialError('');
    if (!config.googleAndroidClientId && !config.googleIosClientId && !config.googleExpoClientId && !config.googleWebClientId) {
      setSocialError('Google sign-in is not configured yet. Add Google client IDs in config.js.');
      return;
    }
    await promptGoogleAuth();
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const decodedToken = credential.identityToken ? jwtDecode(credential.identityToken) : {};
      const email = credential.email || decodedToken?.email || '';
      const firstName = credential.fullName?.givenName || '';
      const lastName = credential.fullName?.familyName || '';

      await completeUserSocialAuth({
        provider: 'apple',
        providerId: credential.user,
        email,
        firstName,
        lastName,
        navigation,
        setUserLoggedIn,
        setUserRole,
        setAppMode,
      });
    } catch (error) {
      console.error('Error during Apple login', error);
      setSocialError(error.message || 'Login failed with Apple');
    }
  };

  const [loaded] = useFonts({
    effortless: require('../assets/fonts/effortless.regular.ttf'),
    aptosDisplayBold: require('../assets/fonts/Aptos-Display-Bold.ttf')
  });

  if (!loaded) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.titleContainerNum}>
      <ActivityIndicator animating={loading} style={loading ? styles.loading : styles.hide} size="large" />
       <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
        <MyText title={'Skier'} style={styles.yogi} h3/>
        <MyText title={'guest'} style={styles.teacherStudio} h3/>
      <View style={styles.enterInfoContainer}>
        <MyText title={'Login '} style={styles.h3} h3 />
        <MyText title={'Enter your email'} style={styles.fieldTitle} />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <TextInput
            style={styles.TextInput}
            placeholder='name@example.com'
            value={email}
            onChangeText={handleEmailChange}
            autoCompleteType='email'
            textContentType='emailAddress'
            keyboardType='email-address'
            required
          />
        </TouchableWithoutFeedback>
        <Text style={styles.errorText}>{emailError}</Text>

        <MyText title={'Enter your password'} style={styles.fieldTitle} />
        <View style={styles.passwordInputContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <TextInput
            style={styles.passwordInput}
            placeholder='Password'
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={!isPasswordVisible}
            autoCompleteType='password'
            textContentType='password'
            required
          />
        </TouchableWithoutFeedback>
          { }
          <TouchableOpacity
            style={styles.passwordVisibilityToggle}
            onPress={togglePasswordVisibility}
          >
            <FontAwesomeIcon
              icon={isPasswordVisible ? faEyeSlash : faEye}
              size={20}
              color='#000'
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>{passwordError}</Text>
        {loginError ? (
          <Text style={styles.loginErrorText}>{loginError}</Text>
        ) : null}

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>Sign In</Text>
        </TouchableOpacity>
        <View style={styles.orContainer}>
          <View style={styles.lineSeparator} />
          <View title={'or'} style={styles.orLabel}>
            <Text>or</Text>
          </View>
          <View style={styles.lineSeparator} />
        </View>
        <View style={styles.socialContainer}>
          <MyText title={'sign in with:'} style={styles.socialText} p />
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => navigation.navigate('EnterPhone', { startPhoneAuth: true })}
            >
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
                <Image style={styles.imgSocial} source={require('../img/google-logo-png-open-2000.png')} />
              </View>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin}>
                <View style={styles.spanSocial}>
                  <Image style={styles.imgSocial} source={{ uri: 'https://logospng.org/download/apple/logo-apple-1024.png' }} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {socialError ? <Text style={styles.loginErrorText}>{socialError}</Text> : null}

        <View style={styles.registrationContainer}>
          <Text style={styles.newUserText}>New User?</Text>
          <TouchableOpacity style={styles.registrationButton} onPress={() => navigation.navigate("EnterPhone")}>
            <Text style={styles.registrationButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
         <View style={styles.ymIconContainer}>
                  <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
              </View>
        </View>
             
      </View>
    </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  titleContainerNum: {
    paddingTop: hp('10%'),
    margin: 0,
    flex: 1,
    padding: 40,
    backgroundColor: "#c12818",
  },

  h1: {
    fontSize: 55,
    textAlign: 'center',
    color: '#ffebd6',
    marginBottom: 10
  },

  h3: {
    fontSize: 31,
    textAlign: 'center',
    color: '#c12818',
    marginBottom: 20,
  },

    yogi: {
    color: '#ffebd6',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'effortless',
    fontSize: 28
  },

    teacherStudio: {
      color: '#ffebd6',
      textAlign: 'center',
      marginBottom: 15,
      fontFamily: 'effortless',
      fontSize: 18
},
  enterInfoContainer: {
    marginTop: 20,
    borderRadius: 30,
    padding: 20,
    backgroundColor: '#ffebd6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  fieldTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    //borderWidth: 2,
    height: 50,
    borderRadius: 30,
    paddingHorizontal: 20,
    marginTop: 5,
    backgroundColor: "#f4835b"
  },

  passwordInput: {
    flex: 1,
    fontFamily: 'aptosDisplayBold',
    height: 50,
    color: '#941004',
    fontSize: 24,
    backgroundColor: 'transparent',
  },
  passwordVisibilityToggle: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  }
  ,
  TextInput: {
    fontFamily: 'aptosDisplayBold',
    fontSize: 24,
    height: 50,
    color: '#941004',
    backgroundColor: "#f4835b",
    borderRadius: 30,
    width: "100%",
    paddingHorizontal: 20,
  },

  loginBtn: {
    width: "50%",
    borderRadius: 25,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    backgroundColor: "#f4835b",
    alignSelf: "center",
  },

  loginText: {
    color: '#941004',
    fontSize: 20,
    fontWeight: 'bold',
  },

  registrationContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },

  newUserText: {
    marginRight: 10,
    fontSize: 18,
  },

  registrationButton: {
    width: "50%",
    borderRadius: 25,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: "#c12818",
  },

  registrationButtonText: {
    color: '#ffebd6',
    fontSize: 20,
    fontWeight: 'bold',
  },

  errorText: {
    color: 'red',
    // marginBottom: 5,
  },

  loginErrorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  orContainer: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginBottom: 5
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
    fontWeight: 600,
  },
  socialContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  socialButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  socialButton: {
    padding: 10,
    marginTop: 5,
    color: 'black',
    backgroundColor: 'transparent',
    fontWeight: 500,
    height: 50,
  },
  socialText: {
    fontSize: 16,
    fontWeight: 600,
    display: 'flex',
    textAlign: 'center'
  },
  imgSocial: {
    margin: 0,
    display: 'flex',
    width: 40,
    height: 40,
    marginBottom: 5,
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
    marginBottom: 5,
  },
  spanSocial: {
    alignItems: 'center',
    display: 'flex',
  },
  
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: '#00000060',
  },

  hide: {
    display: 'none',
  },

      ymIconContainer: {
        flex:1,
        marginTop: 20,
        alignItems: 'center'
    }, 

    ymIcon: {
        width: 70,
        height: 70,
    },

});
