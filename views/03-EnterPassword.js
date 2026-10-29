import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image,ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faArrowLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';

export default function EnterPassword({ route, navigation }) {
  
  const [passwordValue, setPasswordValue] = useState('password');
  const [password, setPassword] = useState('');
  const [passwordConfirmValue, setPasswordConfirmValue] = useState('password');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');

  const onPasswordChange = (text) => {
    setPassword(text);
  };

  const togglePassword = () => {
    const newPasswordValue = passwordValue === 'password' ? 'text' : 'password';
    setPasswordValue(newPasswordValue);
  };

  const onPasswordConfirmChange = (text) => {
    setPasswordConfirm(text);
  };

  const togglePasswordConfirm = () => {
    const newPasswordConfirmValue = passwordConfirmValue === 'password' ? 'text' : 'password';
    setPasswordConfirmValue(newPasswordConfirmValue);
  };

  const handleSubmit = () => {
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8 || passwordConfirm.length < 8) {
      setError('Password is too short');
      return;
    }

    const { phoneNumber, email } = route.params|| { phoneNumber: '' , email: ''};

    navigation.navigate('EnterName', {
      phoneNumber: phoneNumber,
      email: email,
      password: password,
    });
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
      <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
      <MyText title={'skier'} style={styles.yogi} h3/>
      <View style={styles.enterInfoContainer}>
        
      <MyText title={`Create Your Account Password`} style={styles.titleMessage} h3 />
      <MyText title={'Your passwords must be at least 8 characters long, and contain at least one letter and one number.'} style={styles.h4} h4 />
      <MyText title={'Enter Password'} style={styles.h3} h3 />
      <View style={styles.passwordContainer}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <TextInput
          secureTextEntry={passwordValue === 'password'}
          style={styles.passwordInput}
          placeholder='Enter your password'
          value={password}
          onChangeText={onPasswordChange}
          required
        />
      </TouchableWithoutFeedback>
        <TouchableOpacity style={styles.eyeButton} onPress={togglePassword}>
          {passwordValue === 'password' ? (
            <FontAwesomeIcon icon={faEye} />
          ) : (
            <FontAwesomeIcon icon={faEyeSlash} />
          )}
        </TouchableOpacity>
      </View>
      <MyText title={'Confirm Password'} style={styles.h3} h3 />
      <View style={styles.confirmPasswordContainer}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <TextInput
          secureTextEntry={passwordConfirmValue === 'password'}
          style={styles.passwordInput}
          placeholder='Enter your password again'
          value={passwordConfirm}
          onChangeText={onPasswordConfirmChange}
          required
        />
      </TouchableWithoutFeedback>
        <TouchableOpacity style={styles.eyeButton} onPress={togglePasswordConfirm}>
          {passwordConfirmValue === 'password' ? (
            <FontAwesomeIcon icon={faEye} />
          ) : (
            <FontAwesomeIcon icon={faEyeSlash} />
          )}
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.navButtonsContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('EnterEmail')}>
          <View style={styles.buttonContents}>
            <FontAwesomeIcon icon={faArrowLeft} size={22} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleSubmit}>
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
    margin: 0,
    flex: 1,
    padding: 20,
    backgroundColor: '#c12818',
  },

    enterInfoContainer: {
    marginTop: 20,
    borderRadius: 30,
    padding: 30,
    backgroundColor: '#ffebd6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    height: 500
  },

    yogi: {
    color: '#ffebd6',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'effortless',
    fontSize: 28
  },

  h1: {
    fontSize: 65,
    textAlign: 'center',
    color: '#ffebd6',
    marginBottom: 20,
    marginTop: 70,
  },

  h3: {
    textAlign: 'left',
    paddingTop: 10,
    marginBottom: 5,
  },

  titleMessage: {
    marginVertical: 10,
    fontSize: 23,
    textAlign: 'left',
  },

  h4: {
    fontWeight: '500',
    textAlign: 'left',
    fontSize: 14,
  },

  error: {
    color: '#810101ff',
  },

  buttonText: {
    margin: 0,
    textAlign: 'center',
    padding: 13,
    fontSize: 25,
    fontWeight: 'normal',
    fontFamily: 'effortless',
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

  ymIconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },

  ymIcon: {
    width: 70,
    height: 70,
  },

  inputBoxContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },

  passwordContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center', 
  },

  confirmPasswordContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center', 
    marginBottom:30,
  },

  passwordInput: {
    backgroundColor: '#f4835b',
    height: 50,
    color: '#941004',
    fontFamily: 'aptosDisplayBold',
    fontSize: 24,
    paddingHorizontal: 20,
    marginTop: 10,
    flex: 1, // Allow the input field to take up available space
  },

  eyeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0, // Remove border
    marginLeft: -30, // Adjust the eye icon position
  },
});



//   return (
//     <div>
//        <h1>Skimatt</h1>
//       <h3>Create Your Account Password</h3>
//       <h4>Your passwords must be at least 8 characters long, and contain at least one letter and one number.</h4>
//       <form className='password-form' onSubmit={handleSubmit}>
//         <h3 className='password-title'>Enter Password</h3>
//         <div className='password-div'>
//         <input
//             type= {passwordValue}
//             className='PasswordInput'
//             name='password'
//             placeholder='Enter your password'
//             value={password}
//             onChange={onPasswordChange}
//             required
//         />
//         <button className='eye-button' onClick={togglePassword}>
//           {passwordValue === 'password' ? (
//             <FontAwesomeIcon icon={faEye} />
          
//           ) : (
//             <FontAwesomeIcon icon={faEyeSlash} />
//           )}
//         </button>
//         </div>
//         <h3 className='password-title'>Confirm Password</h3>

//         <div className='password-confirm-div'>

//         <input
//             type={passwordConfirmValue}
//             className='PasswordInput'
//             name='passwordConfirm'
//             placeholder='Enter your password again'
//             value={passwordConfirm}
//             onChange={onPasswordConfirmChange}
//             required
//         />
//         <button className='eye-button-confirm' onClick={togglePasswordConfirm}>
//           {passwordConfirmValue === 'password' ? (
//             <FontAwesomeIcon icon={faEye} />
          
//           ) : (
//             <FontAwesomeIcon icon={faEyeSlash} />
//           )}
//         </button>
//         </div>

//           <div className='error'>{error}</div>
//         <div className='msg'>{msg}</div>
//         <div className='buttons'>
//           <button className='back-button' type='button' onClick={() => navigate(-1)}><FontAwesomeIcon icon={faArrowLeft} /></button>
//           <button className='next-button' type='submit'><p>next <FontAwesomeIcon icon={faArrowRight} /></p></button>
//         </div>
//       </form>
//       <img src={ymIcon} className='ym-icon' />
//     </div>
//   )
// }