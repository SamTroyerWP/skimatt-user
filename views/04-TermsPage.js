import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Linking, ScrollView } from 'react-native';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import Checkbox from 'expo-checkbox';
import config from '../views/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationContext from '../context/NavigationContext';

export default function TermsPage({ route, navigation }) {

  const { setUserLoggedIn } = useContext(NavigationContext);

  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');

  // Function to generate a random token (you should use a secure method for this)
  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // Function to save the token to AsyncStorage
const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem('userToken', token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

// Function to retrieve the token from AsyncStorage
const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

  const { phoneNumber, email, password, firstName, lastName } = route.params||{ phoneNumber: '' , email: '',password:'',firstName:'', lastName :''};
  
  const handleSubmit = async () => {
    if (!isChecked) {
      setError('Please check the box!');
      return;
    }

    //  user data to send to the server
    const userData = {
      phoneNumber,
      email,
      password,
      firstName,
      lastName,
    };

    try {
      // Make a POST request to create a user
      const response = await fetch(`${config.apiUrl}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (response.status === 201) {
        // User created successfully
        console.log('User created successfully in the database!');
        console.log('Mobile Number:', phoneNumber);
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('FirstName:', firstName);
        console.log('Last Name:', lastName);
        alert('Congratulations on creating a Skimatt account!  Login to start experiencing the YM platform.')
        // const respObj = await response.json()
        // await AsyncStorage.setItem('userToken', respObj.token);
        // const token = generateToken();
        // await saveToken(token);
        // setUserLoggedIn(true);
        navigation.navigate('EnterApp');
      } else if (response.status === 409) {
        setError('User with the given email already exists.');
      } else {
        // Handle other error statuses
        const errorData = await response.json();
        setError(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('An error occurred while creating the user.');
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
      <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
      <MyText title={'skier'} style={styles.yogi} h3/>
      <View style={styles.termsTitleContainer}>
      <Image style={styles.clipboard} source={require('../img/clipboard-green.png')} />
        <MyText
          title={`Accept skimatt's Terms & Review Privacy Notice`}
          style={styles.titleMessage}
          h3
        />
      </View>
      <Text style={styles.h4} h4>
        by selecting "I Agree" below, I have reviewed and agree to the{' '}
        <Text
          style={{ color: 'blue' }}
          onPress={() => {
            Linking.openURL(
              'https://www.dropbox.com/scl/fi/cjdtnk6wbu40tga721j4b/Yogamatt-Terms-and-Conditions.pdf?rlkey=599m3heyxehsztodbrtozrtbv&st=n9l39wtt&dl=1'
            );
          }}
        >
          Terms of Use
        </Text>{' '}
        and acknowledge the{' '}
        <Text
          style={{ color: 'blue' }}
          onPress={() => {
            Linking.openURL(
              'https://yogamatt.info/f/yogamatt-privacy-policy'
            );
          }}
        >
          Privacy Notice
        </Text>{' '}
        . I am at least 18 years of age.
      </Text>
      <View style={styles.lineSeparator} />
      <View style={styles.agreeCheckbox}>
        <MyText title={'I agree'} style={styles.h4} h4 />
        <Checkbox
          style={styles.checkbox}
          onValueChange={setIsChecked}
          value={isChecked}
          color={isChecked ? '#4630EB' : undefined}
        />
      </View>
      <Text style={styles.error}>{error}</Text>

      <View style={styles.navButtonsContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('EnterName')}
        >
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
    margin: 0,
    marginTop: 100,
    flex: 1,
    padding: 20,
    backgroundColor: '#c12818',
  },

  h1: {
    fontSize: 60,
    textAlign: 'center',
    color: '#ffebd6',
    marginBottom: 5,
  },

    yogi: {
    color: '#ffebd6',
    textAlign: 'center',
    marginBottom: 25,
    fontFamily: 'effortless',
    fontSize: 28
  },

  h3: {
    textAlign: 'left',
    paddingTop: 10,
  },

  titleMessage: {
    marginVertical: 10,
    width: 200,
    fontSize: 24,
    textAlign: 'center',
    color: '#c12818',
  },

  h4: {
    textAlign: 'left',
    fontSize: 16,
    color: '#fff',
    fontfamily: 'aptosDisplayBold'
  },

  inputBoxContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
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
    backgroundColor: '#ffebd6',
    height: 50,
    width: 50,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextButton: {
    color: '#7F5345',
    backgroundColor: '#ffebd6',
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

  lineSeparator: {
    backgroundColor: '#000',
    height: 1,
    marginVertical: 30,
    marginBottom:30
  },

  agreeCheckbox: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' 
  },

  error: {
    color: '#810101ff',
  },
  clipboard:{
    width: 70,
    height: 70,
  },
  termsTitleContainer:{
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffebd6',
    padding:10,
    borderRadius:10,
    alignItems:'center',
    marginBottom:20,
    width:'100%'
  }
});