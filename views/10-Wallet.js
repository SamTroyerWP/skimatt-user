import React, {useState, useEffect, useContext, useRef} from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Modal,
  Alert,
  Pressable,
  Dimensions,
} from 'react-native';

const PAYMENT_MENU_WIDTH = 188;
const PAYMENT_MENU_HEIGHT = 108;
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import BackButton from '../components/Buttons/BackButton';
import AddPayButton from '../components/Buttons/AddPayButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import { useIsFocused } from '@react-navigation/native';
import NavigationContext from '../context/NavigationContext';

export default function Wallet({ navigation }) {

    const { userLoggedIn, setUserLoggedIn } = useContext(NavigationContext);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState('');
    const isFocused = useIsFocused();
    const [cardPaymentMethods, setCardPaymentMethods] = useState([]);
    const [bankPaymentMethods, setBankPaymentMethods] = useState([]);

    const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState('');

    const [customerId, setCustomerId] = useState();
  
    const [isModalVisible, setIsModalVisible] = useState(false);

    const paymentMenuDotsRefs = useRef({});
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [activePaymentMethodId, setActivePaymentMethodId] = useState(null);

    const closePaymentMenu = () => {
      setIsModalVisible(false);
      setActivePaymentMethodId(null);
      setMenuAnchor(null);
    };

    const handleOpenPaymentMenu = (paymentMethodId) => {
      const node = paymentMenuDotsRefs.current[paymentMethodId];
      if (!node) {
        const { width: screenW, height: screenH } = Dimensions.get('window');
        setMenuAnchor({
          left: (screenW - PAYMENT_MENU_WIDTH) / 2,
          top: screenH / 2 - PAYMENT_MENU_HEIGHT / 2,
        });
        setActivePaymentMethodId(paymentMethodId);
        setIsModalVisible(true);
        return;
      }
      node.measureInWindow((x, y, width, height) => {
        const { width: screenW, height: screenH } = Dimensions.get('window');
        let left = x + width / 2 - PAYMENT_MENU_WIDTH / 2;
        let top = y - PAYMENT_MENU_HEIGHT - 8;
        left = Math.min(Math.max(8, left), screenW - PAYMENT_MENU_WIDTH - 8);
        top = Math.min(Math.max(8, top), screenH - PAYMENT_MENU_HEIGHT - 8);
        setMenuAnchor({ left, top });
        setActivePaymentMethodId(paymentMethodId);
        setIsModalVisible(true);
      });
    };
  

    const [userData, setUserData] = useState({
        email: '',
        _id: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        customerId: '',
        profileImage: ''
      });
    
      useEffect(() => {
        setLoading(true);
        (async () => {
          const token = await AsyncStorage.getItem('userToken');
          const userResp = await fetch(`${config.apiUrl}/users/get`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
          });
          if (userResp.status !== 200) {
            alert('You have been signed out due to inactivity.  Please log back in.');
            setUserLoggedIn(false);
          }
          const userData = await userResp.json();
          setUserData(userData);
       
          setLoading(false);
        })();
      }, []);

      useEffect(() => {
        setLoading(true);
        if (userData) {
            setLoading(false);
          fetchPaymentMethods(userData);
        }
      }, [userData]); // Fetch payment methods when isFocused changes
    
      const fetchPaymentMethods = async (userData) => { 
     
        try {
          setCustomerId(userData.customerId);

          // Fetch the default payment method ID first
          const defaultPaymentMethodResponse = await fetch(`${config.apiUrl}/payment/get-default-payment-method/${userData.customerId}`);
          const defaultPaymentMethodData = await defaultPaymentMethodResponse.json();
          const defaultPaymentMethodId = defaultPaymentMethodData.defaultPaymentMethodId;

          const paymentMethodsResponse = await fetch(`${config.apiUrl}/payment/get-payment-methods/${userData.customerId}`);
          const paymentMethodsData = await paymentMethodsResponse.json();
          setCardPaymentMethods(paymentMethodsData.cardPaymentMethods);
          setBankPaymentMethods(paymentMethodsData.bankPaymentMethods);
          setIsLoading(false);
          // Log payment methods to the console
          console.log('Card Payment Methods:');
          paymentMethodsData.cardPaymentMethods.forEach((cardPaymentMethod) => {
            console.log(cardPaymentMethod);
          });
          console.log('Bank Payment Methods:');
          paymentMethodsData.bankPaymentMethods.forEach((bankPaymentMethod) => {
            console.log(bankPaymentMethod);
          });

          setDefaultPaymentMethodId(defaultPaymentMethodId);
          console.log('Default Payment Method ID:', defaultPaymentMethodId);
        } catch (error) {
          setIsLoading(false);
      }
    };
  
    const handleSetDefaultPaymentMethod = async (paymentMethodId) => {
      const stripeCustomerId = customerId || userData.customerId;
      if (!stripeCustomerId || !paymentMethodId) return;
      try {
        setLoading(true);
        const response = await fetch(
          `${config.apiUrl}/payment/set-customer-default-payment-method`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: stripeCustomerId,
              paymentMethodId,
            }),
          }
        );
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          setDefaultPaymentMethodId(paymentMethodId);
          Alert.alert('Updated', 'Default payment method saved.');
          setIsModalVisible(false);
        } else {
          Alert.alert(
            'Error',
            data.error || 'Could not set default payment method.'
          );
        }
      } catch (error) {
        console.error('Error setting default payment method:', error);
        Alert.alert('Error', 'Could not set default payment method.');
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteCard = async (paymentMethodId) => {
      try {
        setLoading(true);
        // Send a request to your backend to delete the payment method
        const response = await fetch(`${config.apiUrl}/payment/delete-payment-method-user/${customerId}/${paymentMethodId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // Add any necessary authorization headers, such as token
            // Authorization: `Bearer ${accessToken}`,
          },
        });
    
        if (response.ok) {
          alert('Payment Method deleted successfully')
          fetchPaymentMethods(userData);
          closePaymentMenu();
        }
      } catch (error) {
        console.error('Error deleting payment method:', error.message);
        setError('Failed to delete payment method');
      } finally {
        setLoading(false);
      }
    };

    const [loaded] = useFonts({
        effortless: require('../assets/fonts/effortless.regular.ttf'),
        bebesNeue: require('../assets/fonts/BebasNeue-Regular.ttf'),
        americanTypewriter: require('../assets/fonts/american-typewriter.ttf'),
        americanTypewriterBold: require('../assets/fonts/american-typewriter-bold.ttf')
      });
    
      if (!loaded) {
        return null;
      }
    

    return (
        <View style={styles.titleContainerNum}>
            <View style={styles.userHeader}>
                <View style={styles.userInfoContainer}>
                  <View style={styles.userNameRatingContainer}>
                    <MyText title={`${userData.firstName} ${userData.lastName}`} style={styles.userInfo} p />
                  </View>
                    <Image style={styles.profileIcon} source={userData.profileImage ? { uri: userData.profileImage } : require ('../img/profile-user.png')} />
                </View>
                <View style={styles.walletButton}>
                    <Text style={styles.walletText}>Wallet</Text>
                </View>
            </View>
            <View style={styles.paymentMethodsContainer}>
                <MyText title={'Payment Methods'} style={styles.paymentMethodsTitle} p />
                {isLoading ? (
                    <Text>Loading...</Text>
                    ) : cardPaymentMethods || bankPaymentMethods  ? (
                        // If payment methods exist, render the list
                          <View>
                            {bankPaymentMethods.map((item, index) => (
                              <View style={styles.paymentOption} key={item.id}>
                                {item.type === 'us_bank_account' ?
                                <Image 
                                  style={styles.creditCardIcon} 
                                  source={require('../img/bank-icon.png')} 
                                /> 
                                : null }
                                <View style={styles.paymentOptionTitleContainer}>
                                  <MyText style={styles.paymentOptionTitle} title={`*** ${item.us_bank_account.last4}`}></MyText>
                                </View>
                                <TouchableOpacity
                                  style={styles.optionDots}
                                  ref={(el) => {
                                    paymentMenuDotsRefs.current[item.id] = el;
                                  }}
                                  onPress={() => handleOpenPaymentMenu(item.id)}
                                >
                                  <FontAwesomeIcon icon={faEllipsis} size={30} color='#e8987c' />
                                </TouchableOpacity>
                              </View>
                            ))}  
                            {cardPaymentMethods.map((item, index) => (
                              <View style={styles.paymentOption} key={item.id}>
                                {item.type === 'card' ? (
                                <Image 
                                  style={styles.creditCardIcon} 
                                  source={require('../img/credit-card.png')} 
                                />
                                ) : item.type === 'link' ? (
                                <Image 
                                  style={styles.creditCardIcon} 
                                  source={require('../img/link-logo.png')} 
                                />
                                ) : null }
                                <View style={styles.paymentOptionTitleContainer}>
                                  <MyText
                                    style={styles.paymentOptionTitle}
                                    title={`*** ${item.type === 'link' ? 'Link' : item.card?.last4 || '????'}${item.id === defaultPaymentMethodId ? ' (default)' : ''}`}
                                  />
                                  {item.id !== defaultPaymentMethodId ? (
                                    <TouchableOpacity
                                      style={styles.setDefaultButton}
                                      onPress={() => handleSetDefaultPaymentMethod(item.id)}
                                    >
                                      <Text style={styles.setDefaultButtonText}>Set Default</Text>
                                    </TouchableOpacity>
                                  ) : null}
                                </View>
                                <TouchableOpacity
                                  style={styles.optionDots}
                                  ref={(el) => {
                                    paymentMenuDotsRefs.current[item.id] = el;
                                  }}
                                  onPress={() => handleOpenPaymentMenu(item.id)}
                                >
                                  <FontAwesomeIcon icon={faEllipsis} size={30} color='#e8987c' />
                                </TouchableOpacity>
                              </View>
                            ))}     
                          </View>  
                          ) : (
                            // If no payment methods exist, display a message
                            <Text>Please add a payment method</Text>
                          )}  
                <View style={styles.addPayButton}>
                    <AddPayButton navigation={navigation} screenName="AddPaymentMethod" />
                </View>
            </View>
            
            <View style={styles.navButtonsContainer}>
            <BackButton  navigation={navigation} screenName="Profile" />
                
            </View>


            <View style={styles.ymIconContainer}>
                <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
            </View>

            <Modal
              transparent
              visible={isModalVisible}
              animationType="fade"
              onRequestClose={closePaymentMenu}
            >
              <View style={styles.modalBackdrop} pointerEvents="box-none">
                <Pressable style={styles.modalDismissArea} onPress={closePaymentMenu} />
                {menuAnchor ? (
                  <View
                    style={[
                      styles.modalCard,
                      { left: menuAnchor.left, top: menuAnchor.top },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={closePaymentMenu}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Text style={styles.modalCloseText}>×</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalDeleteButton}
                      onPress={() => activePaymentMethodId && handleDeleteCard(activePaymentMethodId)}
                      accessibilityRole="button"
                      accessibilityLabel="Delete payment method"
                    >
                      <Text style={styles.modalDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </Modal>
        </View>
    )

} 


const styles = StyleSheet.create({
    titleContainerNum: {
        margin: 0,
        flex: 1,
        padding: 40,
        marginLeft: -10,
        marginTop: -30,
        backgroundColor: '#ffebd6',
       
    },
   
    h1: {
        fontSize: 65,
        textAlign: 'center',
        color: '#c12818',
        marginBottom: 20,
    },

    addPaymentTitle: {
        fontFamily: 'bebesNeue',
        marginTop: 10,
        paddingVertical: 20,
        color: '#c12818',
        backgroundColor: '#000',
        height: 70,
        alignContent: 'center',
        marginHorizontal: -40,
        paddingLeft: 50
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
        alignItems: 'center',
        // marginTop: 20
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
    

    navButtonsContainer: {
        marginBottom: 10,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginLeft: 20,
        marginTop: 100
    },
    profileIcon: {
        height: 70,
        width: 70,
        margin: 10,
        marginLeft: 50,
        borderRadius: 50
    },

    userInfoContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 40
    },

    userInfo: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 30,
        color: '#c12818',
        marginRight: 50
    },

    userHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 40,

    },

    paymentMethodsContainer: {
        margin: 20,
        marginVertical: 50,
        paddingHorizontal: 8,
    },

    paymentMethodsTitle: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 20,
        color: '#c12818',
        marginVertical: 10
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        paddingVertical: 4,
        paddingRight: 4,
    },
    paymentOptionTitle: {
        textAlign: 'left',
        color: '#c12818',
        fontSize: 18,
        marginRight: 6,
        flexShrink: 1,
    },

    paymentOptionTitleContainer: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,
        marginLeft: 12,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    creditCardIcon: {
        width: 40,
        height: 40,
        flexShrink: 0,
    },

    paypalIcon: {
        width: 40,
        height: 40
    },
    walletButton: {
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 60,
        borderRadius: 50,
        padding: 5,
        width: 250,
        marginTop: 20

    },
    walletText: {
        textAlign: 'center',
        alignItems: 'center',
        fontSize: 40,
        fontWeight: 'normal',
        fontFamily: 'americanTypewriterBold'
    },

    dropdown: {
        marginHorizontal: 10,
        height: 50,
        borderBottomColor: 'gray',
        borderBottomWidth: 0.5,
        paddingHorizontal: 10
      },
      
      placeholderStyle: {
        fontSize: 16,
      },
      selectedTextStyle: {
        fontSize: 16,
      },
      iconStyle: {
        width: 20,
        height: 20,
      },
      inputSearchStyle: {
        height: 40,
        fontSize: 16,
      },
      selectedStyle: {
        borderRadius: 12,
      },
      addPayButton: {
        marginTop: 20
      },
      optionDots: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginLeft: 4,
      },
    
      modalBackdrop: {
        flex: 1,
        backgroundColor: 'transparent',
      },

      modalDismissArea: {
        ...StyleSheet.absoluteFillObject,
      },

      modalCard: {
        position: 'absolute',
        width: PAYMENT_MENU_WIDTH,
        backgroundColor: '#ffebd6',
        borderColor: '#c12818',
        borderWidth: 4,
        borderRadius: 16,
        paddingTop: 10,
        paddingBottom: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
      },

      modalCloseButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e8987c',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#68281B',
        marginBottom: 6,
      },

      modalCloseText: {
        fontSize: 26,
        lineHeight: 28,
        fontFamily: 'americanTypewriterBold',
        color: '#c12818',
        marginTop: -2,
      },

      modalDeleteButton: {
        backgroundColor: '#e8987c',
        borderRadius: 28,
        borderWidth: 2,
        borderColor: '#68281B',
        paddingVertical: 10,
        paddingHorizontal: 28,
        width: '100%',
        alignItems: 'center',
      },

      modalDeleteText: {
        fontSize: 18,
        fontFamily: 'americanTypewriterBold',
        color: '#c12818',
      },

      setDefaultButton: {
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#e8987c',
        backgroundColor: '#e8987c',
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginLeft: 6,
        flexShrink: 0,
      },
    
      setDefaultButtonText: {
        fontWeight: 'bold',
        fontFamily: 'americanTypewriterBold',
        color: '#c12818',
      },

      userNameRatingContainer: {
        width: 200
      },
})

