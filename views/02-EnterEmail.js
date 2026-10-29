import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator, 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Linking,
  Pressable,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import OtpInputField from '../components/OtpInputField';
import config from '../views/config';

export default function EnterEmail({ route, navigation }) {
  const [email, setEmail] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailValid, setEmailValid] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [pinCode, setPinCode] = useState('');
  const [isPinReady, setIsPinReady] = useState(false);
  const maximumCodeLength = 6;

  const randomCode = Math.floor(100000 + Math.random() * 900000)

  const codeInputRef = useRef(); // Reference to the ReactNativePhoneInput component
  
  const handleTapOutside = () => {
    // Dismiss the keyboard by blurring the input field
    if (codeInputRef.current) {
      codeInputRef.current.blur();
    }
  };

  const postUser = async () => {

    const { phoneNumber } = route.params || { phoneNumber: '' };
   
    try {
      if (!email) {
        setEmailError('Email is empty');
        return;
      }


      const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      const lowerCaseEmail = email.toLowerCase(); // Convert the entered email to lowercase

      if (!emailPattern.test(lowerCaseEmail)) {
        setEmailError('Invalid email format');
        return;
      }

      const response = await fetch(`${config.apiUrl}/users/check-email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: 'User',
          lastName: 'Name',
          email: lowerCaseEmail, 
          password: 'aB@1234567',
          phoneNumber: phoneNumber,
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.emailExists) {
          setEmailExists(true);
          alert('Email already exists. Please enter another email.');
        } else {
        
          await fetch(`${config.apiUrl}/users/send-verification-email`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: lowerCaseEmail, 
              randomCode: randomCode
            })
          });
          console.log(randomCode)
          setEmailExists(false);
          setEmailValid(true);
        }
      } else {
        alert('An error occurred. Please try again later.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error has occurred. Please try again later.');
    }
  };

  const resendCode = async () => {
   
    const { phoneNumber } = route.params || { phoneNumber: '' };
    const lowerCaseEmail = email.toLowerCase(); // Convert the entered email to lowercase
    
    try {
      const response = await fetch(`${config.apiUrl}/users/send-verification-email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: lowerCaseEmail, 
          randomCode: randomCode
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Handle success
        console.log(result);
        alert('verification code sent successfully!')
        setLoading(false)
        setOtpCode(randomCode)
      } else {
        const error = await response.json();
        // Handle error
        console.error(error);
        alert('an error has occurred!')
      }
    } catch (error) {
      // Handle network or other errors
      console.error(error);
    }
  }
  const verifyCode = async () => {

    const { phoneNumber } = route.params || { phoneNumber: '' };
    const lowerCaseEmail = email.toLowerCase(); // Convert the entered email to lowercase

    const data = {
      otpCode: otpCode,
      pinCode: Number(pinCode)
    }

    console.log(otpCode, pinCode)

    try {
      const responseCode = await fetch(`${config.apiUrl}/users/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseToken = await fetch(`${config.apiUrl}/users/verify`, {
        method: 'GET'
      },
      )

      if (responseCode.ok || responseToken.ok) {
        const result = await responseCode.json();
        // Handle success
        const data = await responseToken.json();
        console.log(result);
        console.log(data);
        alert('Verification Code Approved!  Email is Verified!')
        setLoading(false)
        navigation.navigate('EnterPassword', { phoneNumber: phoneNumber, email: lowerCaseEmail } )
      } else {
        const error = await response.json();
        // Handle error
        console.error(error);
        alert('Wrong Verification Code!')
      }
    } catch (error) {
      // Handle network or other errors
      console.error(error);
    }
}

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError('');
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
      {!emailValid ?
      <View style={styles.titleContainerNum}>
        <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
        <MyText title={'Skier'} style={styles.yogi} h3/>
        {/* <View style={styles.enterInfoContainer}> */}
        
        <MyText title={"What's your email address?"} style={styles.titleMessage} h3 />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <TextInput
            style={styles.EmailInput}
            placeholder="name@example.com"
            value={email}
            onChangeText={handleEmailChange}
            required
          />
        </TouchableWithoutFeedback>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        
        <View style={styles.navButtonsContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('EnterPhone')}>
            <View style={styles.buttonContents}>
              <FontAwesomeIcon icon={faArrowLeft} size={22} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={postUser}>
            <View style={styles.buttonContents}>
              <Text style={styles.buttonText}>next</Text>
              <FontAwesomeIcon icon={faArrowRight} size={22} style={styles.arrowIcons} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.ymIconContainer}>
          <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
        </View>
      {/* </View> */}
      </View>
      : 
      <TouchableWithoutFeedback onPress={handleTapOutside}>
        <View style={styles.titleContainerNum}>
          <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
          <MyText title={'Skier'} style={styles.yogi} h3/>
          <View style={styles.enterInfoContainer}>
          <MyText title={`Please enter the code that we've sent to:`} style={styles.verificationMessage} h3 />
          <View style={styles.codeMessage}>
                  <MyText title={email} style={styles.mobileNumber} /> 
              </View>
              
              <Pressable onPress={Keyboard.dismiss}>
                  <OtpInputField
                      code={pinCode}
                      setCode={setPinCode}
                      maximumLength={maximumCodeLength}
                      setIsPinReady={setIsPinReady}
                  />
              </Pressable>
              
              <View style={styles.resendCode}>
                  <TouchableOpacity onPress={resendCode} style={styles.resendCodeButton}>
                      <Text style={styles.resendCodeButtonText}>I did not receive a code</Text>
                  </TouchableOpacity>
              </View>

            {/* {!isVerified ?
            <ActivityIndicator size="large" style={styles.loadingSpinner}/>
            : null } */}

          <View style={styles.navButtonsContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('EnterPhone')}>
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

          <View style={styles.ymIconContainer}>
            <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
          </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
      }
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
    flex: 1,
    padding: 20,
    backgroundColor: '#c12818',
    justifyContent: 'center',
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
    height: 500,
  },

  h1: {
    fontSize: 65,
    textAlign: 'center',
    color: '#ffebd6',
    marginBottom: 20,
  },

  h3: {
    textAlign: 'center',
  },

  yogi: {
    color: '#ffebd6',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'effortless',
    fontSize: 28
  },

  titleMessage: {
    marginVertical: 10,
    fontSize: 23,
    color: '#ffebd6',
    textAlign: 'center'

  },

  errorText: {
    color: 'red',
    marginBottom: 10,
  },

  navButtonsContainer: {
    marginTop: 10,
    marginBottom: 30,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },

  buttonContents: {
    display: 'flex',
    marginHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  backButton: {
    color: '#7F5345',
    backgroundColor: '#f4835b',
    height: 50,
    width: 50,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextButton: {
    color: '#7F5345',
    backgroundColor: '#f4835b',
    height: 50,
    width: 150,
    borderRadius: 50,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },

  buttonText: {
    margin: 0,
    textAlign: 'center',
    padding: 13,
    fontSize: 25,
    fontWeight: 'normal',
    fontFamily: 'effortless',
  },
  ymIconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },

  ymIcon: {
    width: 70,
    height: 70,
  },

  EmailInput: {
    backgroundColor: '#ffebd6',
    height: 50,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom:30,
    fontSize: 20,
    fontFamily: 'aptosDisplayBold',
    color: '#941004'
  },

  otpField: {
    margin: 5
  },

  verificationMessage: {
    marginVertical: 10,
    textAlign: 'center',
  },

  mobileNumber: {
    fontSize: 25,
    color: '#01821F',
    textAlign: 'center'
  },

  loadingSpinner: {
    margin: 30,
    size: 100,
  },

  emailVerificationStatus: {
    textAlign: 'center',
    fontSize: 30
  },

  resendCodeButton: {
    color: '#7F5345',
    backgroundColor: '#f4835b',
    height: 30,
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 50,
    marginVertical: 20,
    marginHorizontal: 60
    
},
resendCodeButtonText: {
  margin: 3,
  textAlign: 'center',
  padding: 5,
  fontSize: 15,
  fontWeight: 'normal',
  fontFamily: 'effortless'
},
  
});

  // const handleOpenEmailboxAsync = async () => {
  //   if (Platform.OS === "ios") {
  //     try {
  //       await openInbox({
  //         message: messageActionSheetiOS,
  //         cancelLabel: "Cancel",
  //       });
  //     } catch (error) {
  //       console.error(`OpenEmailbox > iOS Error > ${error}`);
  //     }
  //   }
  
  //   if (Platform.OS === "android") {
  //     const activityAction = "android.intent.action.MAIN";
  //     const intentParams = {
  //       category: "android.intent.category.APP_EMAIL",
  //     };
  //     IntentLauncher.startActivityAsync(activityAction, intentParams);
  //     console.log('email app opened')
  //   }
  // };

  // const closeCurrentActivity = () => {
  //   IntentLauncher.startActivity({
  //     action: 'android.intent.action.MAIN', // Action to return to the main screen
  //     category: 'android.intent.category.HOME', // Category for the home screen
  //   }).then(() => {
  //     console.log('Activity closed');
  //   });
  // }; 

  
  // const verifyEmail = async () => {

  //   const { phoneNumber } = route.params || { phoneNumber: '' };
  //   const lowerCaseEmail = email.toLowerCase(); // Convert the entered email to lowercase

  //   try {
  //     if (!emailExists) {
  //         navigation.navigate('EnterPassword', { phoneNumber, email: lowerCaseEmail }); // Use the lowercase email in navigation
        
  //     } else {
  //       alert('An error occurred. Please try again later.');
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //     alert('An error has occurred. Please try again later.');
  //   }
  // }
