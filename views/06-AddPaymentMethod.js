import React, {useEffect, useState, Modal, ActivityIndicator, useContext} from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import Checkbox from 'expo-checkbox';
import BackButton from '../components/Buttons/BackButton';
import config from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationContext from '../context/NavigationContext';


export default function AddPaymentMethod({ navigation }) {

    const { userLoggedIn, setUserLoggedIn } = useContext(NavigationContext)
    
    const [paymentMethod, setPaymentMethod] = useState('');
    const [cardIsChecked, setCardIsChecked] = useState(false);
    const [appleIsChecked, setAppleIsChecked] = useState(false);
    const [googleIsChecked, setGoogleIsChecked] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState();

    const [isLoading, setIsLoading] = useState(true);

    const [userData, setUserData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        _id: '',
        customerId: '',
        profileImage: ''
      });

    useEffect(() => {
        setLoading(true);
        (async () => {
          const token = await AsyncStorage.getItem('userToken');
          setToken(token);
    
          const userResp = await fetch(`${config.apiUrl}/users/get`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
          if (userResp.status !== 200) {
            alert('You have been signed out due to inactivity.  Please log back in.');
            setUserLoggedIn(false);
          }
          const userData = await userResp.json();
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          setUserData(userData);
          setLoading(false);
          console.log(userData.email)
          console.log(userData._id.toString())
          console.log(userData.customerId)
        })();
      }, []);


    
    const handleSubmit = async() => {

        if (cardIsChecked === false && appleIsChecked === false && googleIsChecked === false) {
            alert('Please select a payment method')

        }

        if ((cardIsChecked === true && appleIsChecked === true) || (appleIsChecked === true && googleIsChecked === true) || (cardIsChecked === true && googleIsChecked === true) || (appleIsChecked === true && cardIsChecked === true && googleIsChecked === true)) {
            return alert('Please select only one payment method')
        }

        if (cardIsChecked === true) {
                navigation.navigate('CardDetails', { email: userData.email, userId: userData._id, customerId: userData.customerId})

        } else if (appleIsChecked === true) {
            navigation.navigate('AppleSetup', { email: userData.email, userId: userData._id, customerId: userData.customerId, token: token});
        } else if (googleIsChecked === true) {
            navigation.navigate('GoogleSetup', { email: userData.email, userId: userData._id, customerId: userData.customerId, token: token});

        }
    }


    const [loaded] = useFonts({
        effortless: require('../assets/fonts/effortless.regular.ttf'),
        bebesNeue: require('../assets/fonts/BebasNeue-Regular.ttf')
      });
    
      if (!loaded) {
        return null;
      }
    

    return (

        <View style={styles.titleContainerNum}>
            <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
            <MyText title={`Add Payment Method`} style={styles.addPaymentTitle} h2 />
            <View style={styles.paymentOptionsContainer}>
                <View style={styles.paymentOption}>
                    <Image style={styles.creditCardIcon} source={require('../img/credit-card.png')} />
                    <View style={styles.paymentOptionTitleContainer}>
                        <MyText style={styles.paymentOptionTitle} title={'Credit or Debit Card'}></MyText>
                    </View>
                    <Checkbox style={styles.checkbox} value={cardIsChecked} onValueChange={setCardIsChecked} color={cardIsChecked ? '#4630EB' : undefined}  />
                </View>
                {/* <View style={styles.paymentOption}>
                <Image style={styles.paypalIcon} source={require('../img/apple-pay.png')} />
                <View style={styles.paymentOptionTitleContainer}>
                    <MyText style={styles.paymentOptionTitle} title={'Apple Pay'}></MyText>
                </View>
                <Checkbox style={styles.checkbox} value={appleIsChecked} onValueChange={setAppleIsChecked} color={appleIsChecked ? '#4630EB' : undefined} />
                </View>
                <View style={styles.paymentOption}>
                <Image style={styles.googleIcon} source={require('../img/google-pay.png')} />
                <View style={styles.paymentOptionTitleContainer}>
                    <MyText style={styles.paymentOptionTitle} title={'Google Pay'}></MyText>
                </View>
                <Checkbox style={styles.checkbox} value={googleIsChecked} onValueChange={setGoogleIsChecked} color={googleIsChecked ? '#4630EB' : undefined} />
                </View> */}
            </View>
                <Text style={styles.error}>{error}</Text>
            <View style={styles.navButtonsContainer}>
                <BackButton navigation={navigation} screenName="ProfileSettings" />
                <TouchableOpacity style={styles.nextButton} onPress={() => handleSubmit()}>
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
    )

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
    titleContainerNum: {
        margin: 0,
        flex: 1,
        padding: 40,
        backgroundColor: '#ffebd6',
    },
   
    h1: {
        fontSize: 65,
        textAlign: 'center',
        color: '#c12818',
        marginBottom: 20,
        marginTop: 40,
    },

    addPaymentTitle: {
        fontFamily: 'bebesNeue',
        paddingVertical: 20,
        color: '#c12818',
        backgroundColor: '#c12818',
        height: 70,
        alignContent: 'center',
        marginHorizontal: -40,
        paddingLeft: 30
    },

    h3: {
        textAlign:'left',
        paddingTop: 10
    },

  
    titleMessage: {
        marginVertical: 10,
        fontSize: 23,
        textAlign: 'center'
    },
    
    h4: {
        fontWeight: 500,
        textAlign: 'left',
        fontSize: 14
    },

    error: {
        color: 'red'
    },
    
    button: {
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 50,
        fontSize: 25,
        fontWeight: 600,
        borderRadius: 50,

    },

    ymIconContainer: {
        marginTop: 20,
        alignItems: 'center'
    }, 

    ymIcon: {
        width: 70,
        height: 70,
    },

    inputBoxContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 20
    },
    buttonContents: {
        display: 'flex',
        marginHorizontal: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    buttonText: {
        margin: 0,
        textAlign: 'center',
        padding: 15,
        fontSize: 25,
        fontWeight: 'normal',
        fontFamily: 'effortless'
    },
    nextButton: {
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 50,
        fontWeight: 'normal',
        borderRadius: 50,
        width: 150,
        paddingHorizontal: 20,
        justifyContent: 'space-between'
    },
    navButtonsContainer: {
        marginTop: 50,
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row'
    },

    paymentOptionsContainer: {
        marginVertical: 40,
        marginBottom: 50
    },

    creditCardIcon: {
        width: 40,
        height: 40
    },

    paypalIcon: {
        width: 40,
        height: 40
    },

    googleIcon: {
        width: 40,
        height: 40,        
    },
    
    paymentOption: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    }, 
    paymentOptionTitle: {
        textAlign: 'left',
        marginHorizontal: 20,
        color: '#c12818',
        fontSize: 20
    },

    paymentOptionTitleContainer: {
        width: 270
    },

    checkbox: {
        alignItems: 'flex-end',
        textAlign: 'right'
    },

    modalContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
      },
})

