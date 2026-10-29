import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Pressable,
  Dimensions,
} from 'react-native';

const PAYMENT_MENU_WIDTH = 188;
const PAYMENT_MENU_HEIGHT = 108;
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsis, faGear } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import Checkbox from 'expo-checkbox';
import UploadImage from '../components/UploadImage';
import NextButton from '../components/Buttons/NextButton';
import BackButton from '../components/Buttons/BackButton';
import AddPayButton from '../components/Buttons/AddPayButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../views/config';
import { useIsFocused } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import NavigationContext from '../context/NavigationContext';


export default function ProfileSettings({ navigation }) {
  
  const { userLoggedIn, setUserLoggedIn } = useContext(NavigationContext);

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

  const { confirmPayment, retrievePaymentIntent, handleCardAction } = useStripe();

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const handleDeleteFlow = async () => {
    setIsDeleteModalVisible(true);
  }

  const handleDeleteStripeAccount = async () => {
    console.log('delete account')
    console.log('customerid', userData.customerId)
    try {
      const response = await fetch(`${config.apiUrl}/payment/delete-customer-id-payment-methods/${userData.customerId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
      });      
      if (response.ok) {
        console.log('Stripe customer ID and payment methods deleted successfully');
        await handleDeleteAccount();
        console.log('account info deleted')
      }
    } catch (error) {
      console.error('there was an error deleting stripe customer id and payment methods', error.message)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${config.apiUrl}/users/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.ok) {

        await AsyncStorage.clear();
        setUserLoggedIn(false);
        navigation.navigate('Login');
        setIsDeleteModalVisible(false);
        alert('User account deleted successfully!')
        
      } else {
        alert('Error', 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error.message);
      alert('Error', 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCard = async () => {
    // Retrieve customer information and current payment method
    const customerInfo = await retrieveCustomerInfo();
    const currentPaymentMethod = customerInfo.payment_methods[0]; // Adjust this based on your data structure

    // Display current card information to the user (e.g., in a modal or separate screen)

    // When the user confirms the update:
    const { paymentMethod, error } = await handleCardAction(currentPaymentMethod);

    if (error) {
      // Handle error
    } else {
      // Update the payment method on your server
      await updatePaymentMethod(paymentMethod.id);

      // Inform the user that the update was successful
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
        // Update the payment methods after successful deletion
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

  // Replace these with actual functions to interact with your server
  const retrieveCustomerInfo = async () => {
    // Implement logic to retrieve customer info
  };

  const updatePaymentMethod = async (paymentMethodId) => {
    // Implement logic to update the payment method on your server
  };


  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const isFocused = useIsFocused();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    _id: '',
    customerId: '',
    supabaseId: '',
    profileImage: '',
  });

  
  const [checkboxesVal, setCheckboxesVal] = useState({});
  const [typeClasses, setTypeClasses] = useState([]);
  const [typeClassesEl, setTypeClassesEl] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [token, setToken] = useState();

  const [cardPaymentMethods, setCardPaymentMethods] = useState([]);
  const [bankPaymentMethods, setBankPaymentMethods] = useState([]);

  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState('');

  const [customerId, setCustomerId] = useState();
  const [supabaseId, setSupabaseId] = useState();
  
  useEffect(() => {
    setLoading(true);

    const refreshToken = async (userId) => {
      console.log(userId)
      try {
        const response = await fetch(`${config.apiUrl}/users/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });
        const responseData = await response.json();

        if (response.ok) {
          const newToken = responseData.token;
          await AsyncStorage.setItem('userToken', newToken);
          console.log('refreshed token', newToken)
          return newToken;
        } else {
          console.error('Token refresh failed:', responseData);
          setUserLoggedIn(false);
          return null;
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        setUserLoggedIn(false);
        return null;
      }
    };

    const fetchData = async () => {

      setLoading(true);
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (!storedToken) {
          console.error('User token not found. Please log in.');
          setUserLoggedIn(false);
          return;
        }
    // (async () => {
    //   const token = await AsyncStorage.getItem('userToken');
    //   setToken(token);
        setToken(storedToken)

      const userResp = await fetch(`${config.apiUrl}/users/get`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,

        },
        body: JSON.stringify({ token: storedToken }),
      });
      if (userResp.status !== 200) {
        alert('You have been signed out due to inactivity.  Please log back in.');
        setUserLoggedIn(false)
      }
      const userData = await userResp.json();

      if (!userData) {
        alert('An error occurred while processing your request');
      } else if (!userData.customerId) {
        await handleAddStripeCustomer(userData);
      }  else if (userData.customerId) {
        await fetchPaymentMethods(userData);
        console.log(defaultPaymentMethodId);
      }

      // 🔽 Add this block to ensure supabaseId exists
      if (!userData.supabaseId) {
        await handleAddSupabaseAuth(userData, storedToken);
      }
    

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setUserData(userData);
      setLoading(false);

      const { _id: userId } = userData; // Extract provider ID
        const refreshedToken = await refreshToken(userId);
        if (!refreshedToken) {
          return;
        } else {
          const typeClassResp = await fetch(`${config.apiUrl}/types`, {
            method: 'GET',
          });
          const typeClassData = await typeClassResp.json();
          const userTypeClassResp = await fetch(`${config.apiUrl}/u-types/user`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: refreshedToken }),
          });
          const userTypeClassData = await userTypeClassResp.json();
          setUserTypes(userTypeClassData);
          console.log('user types', userTypeClassData)
          setTypeClasses(typeClassData);
        }
        if (userTypes) {
          let _checkboxesVal = {};
          for (const _typeClass of typeClasses) {
            if (userTypes.some((obj) => obj.typeId === _typeClass._id)) {
              _checkboxesVal[_typeClass._id] = true;
            } else {
              _checkboxesVal[_typeClass._id] = false;
            }
          }
          setCheckboxesVal(_checkboxesVal);
          // handleTypeClassesOnChange();
          updateTypeClassesEl();
        }
      // Proceed with fetching other data or handling the providerData...
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error here
    } finally {
      setLoading(false);
    }
   
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (isFocused && userData) {
      fetchPaymentMethods(userData);
    }
  }, [isFocused]); // Fetch payment methods when isFocused changes


  const handleTypeClassesOnChange = (id, val) => {
    let _checkboxesVal = { ...checkboxesVal };
    _checkboxesVal[id] = val;
    setCheckboxesVal(_checkboxesVal);
  };

  useEffect(() => {
    let _checkboxesVal = {};
    for (const _typeClass of typeClasses) {
      if (userTypes.some((obj) => obj.typeId === _typeClass._id)) {
        _checkboxesVal[_typeClass._id] = true;
      } else {
        _checkboxesVal[_typeClass._id] = false;
      }
    }
    setCheckboxesVal(_checkboxesVal);
    updateTypeClassesEl();
  }, [typeClasses]);

  useEffect(() => {
    updateTypeClassesEl()
  }, [checkboxesVal]);

  const updateTypeClassesEl = () => {
    let _typeClassesEl = [];
    for (const _typeClass of typeClasses) {
      _typeClassesEl.push(
        <View style={styles.checkbox} key={_typeClass._id}>
          <Checkbox
            value={checkboxesVal[_typeClass._id]}
            onValueChange={handleTypeClassesOnChange.bind(this, _typeClass._id)}
          />
          <MyText title={_typeClass.typeDesc} style={styles.typeClasses} p />
        </View>
      );
    }
    setTypeClassesEl(_typeClassesEl);
  };

  
  const fetchPaymentMethods = async (userData) => {
      try {

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

                  // Set the default payment method ID
          setDefaultPaymentMethodId(defaultPaymentMethodId);
          console.log('Default Payment Method ID:', defaultPaymentMethodId);

        } catch (error) {
          setIsLoading(false);
      }
  };



  const handleNextPress = () => {
    const hasTrueValue = Object.values(checkboxesVal).some((value) => value === true);
    if (hasTrueValue) {
      setLoading(true);
      fetch(`${config.apiUrl}/u-types/u-type/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          typeIds: checkboxesVal,
        }),
      })
        .then((response) => {
          if (response.status === 200) {
            setLoading(false);
            navigation.navigate('Profile');
          }
        })
        .catch((err) => {
          setLoading(false);
          alert('An error occurred while processing your request');
        });
    } else {
      setError('Select at least one of the above fields.');
    }
  };

  const handleAddSupabaseAuth = async (userData, storedToken) => {
    console.log('storedtoken', storedToken)
    console.log('user id', userData._id)
    try {
      const supabaseResp = await fetch(`${config.apiUrl}/users/create-supabase-auth`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          email: userData.email,
          userId: userData._id, // so backend can update the record
        }),
      });

      const supabaseResult = await supabaseResp.json();

      if (supabaseResp.ok) {
        console.log('Supabase ID created:', supabaseResult.supabaseId);
        userData.supabaseId = supabaseResult.supabaseId; // Update locally
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUserData(userData);
      } else {
        console.error('Failed to create Supabase user:', supabaseResult.message);
      }
    } catch (err) {
      console.error('Error creating Supabase ID:', err);
    }
  }

  const handleAddStripeCustomer = async (userData) => {
      try {
        const response = await fetch(`${config.apiUrl}/payment/create-customer-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({
              email: userData.email,
              userId: userData._id.toString()
          })
      })
          const data = await response.json();
          const customerId = data.customerId;
          setCustomerId(customerId);
          console.log(customerId);
          if (response.ok) {
            const updateUser = async () => {
              try {
                await fetch(`${config.apiUrl}/users/add-customer-id/${userData._id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    customerId: customerId 
                  }), // Send customerId in the body
                });
              } catch (error) {
                  console.error(error);
              }
            }
          await updateUser();
        }
      } catch (error) {
        console.error(error);
        alert('Error creating Stripe customer');
    }
  }
  const [loaded] = useFonts({
    effortless: require('../assets/fonts/effortless.regular.ttf'),
    bebesNeue: require('../assets/fonts/BebasNeue-Regular.ttf'),
    americanTypewriter: require('../assets/fonts/american-typewriter.ttf'),
    americanTypewriterBold: require('../assets/fonts/american-typewriter-bold.ttf'),
  });
   
  if (!loaded) {
    return null;
  }
  

  return (
    <>
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <ActivityIndicator animating={loading} style={loading ? styles.loading : styles.hide} size="large" />

        <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
        <MyText title={'Skier'} style={styles.teacherStudio} h3/>
        <View style={styles.userHeader}>
          <UploadImage id={userData._id} image={userData.profileImage ? userData.profileImage : undefined} />
          <View style={styles.userInfoContainer}>
            <MyText title={`${userData.firstName} ${userData.lastName}`} style={styles.userInfo} p />
            <MyText title={`${userData.phoneNumber}`} style={styles.userInfoContact} p />
            <MyText
              title={`${userData.email}`}
              style={styles.userInfoContactEmail}
              p
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            />
          </View>
        </View>
        <View style={styles.addPaymentTitle}>
          <MyText title={`Profile Settings`} style={styles.profileSettingsText} h2 />
        </View>

        <Modal
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setIsDeleteModalVisible(false)}
        >
        <View style={styles.deleteModalBackground}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsDeleteModalVisible(false)}
        >
          <View style={styles.deleteModal}>
            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.modalMessage}>Are you sure you want to delete your account? This action cannot be undone.</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleDeleteStripeAccount}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
        </View>
      </Modal>
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
                {/* Display other necessary payment method information */} 
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
          <AddPayButton navigation={navigation} screenName='AddPaymentMethod' />
        </View>
      {typeClassesEl}
        <Text style={styles.error}>{error}</Text>
        <View style={styles.navButtonsContainer}>
          {/* <BackButton navigation={navigation} screenName="TermsPage" /> */}
          <NextButton navigation={navigation} handlePress={handleNextPress} />
        </View>
        <View style={styles.ymIconContainer}>
                  <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
                </View>
      </View>
    </ScrollView>

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
    </>
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffebd6',
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 20,
  },
  userInfo: {
    fontFamily: 'americanTypewriterBold',
    fontSize: 30,
    color: '#c12818'
  },
  userInfoContact: {
    fontFamily: 'americanTypewriter',
    fontSize: 20,
    color: '#c12818',
  },

  userInfoContactEmail: {
    fontFamily: 'americanTypewriter',
    fontSize: 20,
    color: '#c12818',
    flexShrink: 1,
    width: '100%',
  },
  
  profileSettingsText: {
    fontFamily: 'bebesNeue',
    fontSize: 26,
    color: '#fff',
  },

  trashIcon: {
    marginRight: 20
  },

      h1: {
        fontSize: 55,
        textAlign: 'center',
        color: '#c12818',
        marginTop: 20,
    },

    teacherStudio: {
      color: '#c12818',
      textAlign: 'center',
      fontFamily: 'effortless',
      fontSize: 28
    },
  addPaymentTitle: {
    display: 'flex',
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: '#c12818',
    height: 70,
    textAlign: 'left',
    paddingLeft: 20,
    justifyContent: 'space-between'
  },


  paymentMethodsContainer: {
    margin: 20,
    marginTop: 0
  },
  paymentMethodsTitle: {
    fontFamily: 'americanTypewriterBold',
    fontSize: 20,
    marginBottom: 10,
    color: '#c12818'
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  paymentOptionTitleContainer: {
    flex: 1,
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  paymentOptionTitle: {
    textAlign: 'left',
    fontSize: 20,
    color: '#c12818',
  },
  creditCardIcon: {
    width: 40,
    height: 40,
  },
  paypalIcon: {
    width: 40,
    height: 40,
  },
  checkboxScrollView: {
    flex: 1,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeClasses: {
    marginLeft: 10,
    fontFamily: 'americanTypewriter',
    color: '#c12818',
    fontSize: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  navButtonsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },

  optionDots: {
    position: 'absolute',
    right: 20,
    top: 0,
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
    marginLeft: 8,
  },

  setDefaultButtonText: {
    fontWeight: 'bold',
    fontFamily: 'americanTypewriterBold',
    color: '#c12818',
  },

  deleteModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Semi-transparent black
  },

  deleteModal: {
    top: 260,
    left: 55,
    width: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
  },

    ymIconContainer: {
    alignItems: 'center',

  },

  ymIcon: {
    width: 70,
    height: 70,
  },

});
