import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image ,ScrollView, Keyboard, TouchableWithoutFeedback} from 'react-native';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';

export default function EnterName({ route, navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleFirstNameChange = (text) => {
    setFirstName(text);
  };

  const handleLastNameChange = (text) => {
    setLastName(text);
  };

  const handleSubmit = () => {
    if (firstName.length < 1 || lastName.length < 1) {
      setError('Please enter both first name and last name');
      return;
    }

    // Clear any previous errors if the validation passes
    setError('');

    // Access data from the previous screen
    const { phoneNumber, email, password } = route.params|| { phoneNumber: '' , email: '',password:''};
    
    navigation.navigate('TermsPage', {
      phoneNumber: phoneNumber,
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
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
      <MyText title={`What's your name?`} style={styles.titleMessage} h3 />
      <MyText title={'by proceeding,you consent to get calls,WhatsApp or SMS messages,including by automated means,from skimatt to the number provided'} style={styles.h4} h4 />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <TextInput
          style={styles.firstNameInput}
          placeholder='Enter First Name'
          value={firstName}
          onChangeText={handleFirstNameChange}
          required
        />
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <TextInput
          style={styles.lastNameInput}
          placeholder='Enter Last Name'
          value={lastName}
          onChangeText={handleLastNameChange}
          required
        />
      </TouchableWithoutFeedback>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.navButtonsContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('EnterPassword')}>
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
        backgroundColor: '#c12818',

  },
  titleContainerNum: {
    //margin: 0,
    flex: 1,
    padding: 30,
    backgroundColor: '#c12818',
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
    height: 500
  },

  h1: {
    fontSize: 65,
    textAlign: 'center',
    color: '#ffebd6',
    marginBottom: 20,
    marginTop: 70,

  },
  h4: {
    fontWeight: '500',
    textAlign: 'left',
    fontSize: 14,
  },

    yogi: {
    color: '#ffebd6',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'effortless',
    fontSize: 28
  },

  titleMessage: {
    marginVertical: 15,
    fontSize: 23,
  },

  error: {
    color: '#810101ff',
  },

  firstNameInput: {
    backgroundColor: '#f4835b',
    height: 50,
    paddingHorizontal: 20,
    fontFamily: 'aptosDisplayBold',
    fontSize: 24,
    color: '#941004',
    marginTop: 10,
  },
  lastNameInput: {
    backgroundColor: '#f4835b',
    height: 50,
    paddingHorizontal: 20,
    fontFamily: 'aptosDisplayBold',
    fontSize: 24,
    color: '#941004',
    marginTop: 20,
    marginBottom:30,
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
    marginTop: 'auto',
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
});
