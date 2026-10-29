import React, {useState, useEffect, useRef} from 'react';
import { Platform, StyleSheet, View, Text, Keyboard, TextInput, TouchableOpacity, Image, TouchableWithoutFeedback, KeyboardAvoidingView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import Checkbox from 'expo-checkbox';
import BackButton from '../components/Buttons/BackButton';
import config from '../views/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePaymentSheet, useStripe, CardField } from '@stripe/stripe-react-native';

export default function CardDetails({ route, navigation }) {

    const insets = useSafeAreaInsets();
    const cardInputRef = useRef();
    const cardDetailsRef = useRef(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
        () => {
          setKeyboardVisible(true);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
        () => {
          setKeyboardVisible(false);
        }
      );
  
      return () => {
        keyboardDidHideListener.remove();
        keyboardDidShowListener.remove();
      };
    }, []);
  
    const handleDoneButton = () => {
      Keyboard.dismiss(); // Dismiss the keyboard when "Done" button is pressed
    };
  
    const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
    const { confirmSetupIntent, createPaymentMethod, retrieveSetupIntent } = useStripe();

    const { email, userId, customerId } = route.params;

    const [setupIntentClientSecret, setSetupIntentClientSecret] = useState('');
    const [ephemeralKey, setEphemeralKey] = useState('');
    const [paymentSheetReady, setPaymentSheetReady] = useState(false);
    const [openingSavedCardPicker, setOpeningSavedCardPicker] = useState(false);
    const [submittingManualCard, setSubmittingManualCard] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);

    const fetchPaymentSheetParams = async () => {
        const response = await fetch(`${config.apiUrl}/payment/payment-sheet`, requestOptionsforCustomerIntent);
        const { setupIntent, customer, ephemeralKey: ephemeralKeySecret } = await response.json();
        return {
            setupIntent,
            ephemeralKey: ephemeralKeySecret,
            customer,
        };
    };

    const initPaymentSheetWithBilling = async (billingName, secrets) => {
        const setupIntent = secrets?.setupIntent ?? setupIntentClientSecret;
        const ephemeralKeySecret = secrets?.ephemeralKey ?? ephemeralKey;
        const customer = secrets?.customer ?? customerId;

        if (!setupIntent || !ephemeralKeySecret || !customer) {
            return { error: { message: 'Payment setup is not ready. Please try again.' } };
        }

        return initPaymentSheet({
            customerId: customer,
            setupIntentClientSecret: setupIntent,
            customerEphemeralKeySecret: ephemeralKeySecret,
            allowsDelayedPaymentMethods: true,
            merchantDisplayName: 'Skimatt, Inc.',
            applePay: {
                merchantCountryCode: 'US',
            },
            googlePay: {
                merchantCountryCode: 'US',
                testEnv: false,
                currencyCode: 'USD',
            },
            defaultBillingDetails: {
                name: billingName || undefined,
                email: email || undefined,
            },
        });
    };

    /** Load Stripe secrets only — do not init Payment Sheet here (that blocks CardField confirm). */
    const loadPaymentSecrets = async () => {
        try {
            const params = await fetchPaymentSheetParams();
            if (!params.setupIntent || !params.customer || !params.ephemeralKey) {
                console.error('Invalid payment sheet params');
                return;
            }
            setSetupIntentClientSecret(params.setupIntent);
            setEphemeralKey(params.ephemeralKey);
            setPaymentSheetReady(true);
        } catch (error) {
            console.error('Error loading payment secrets:', error);
        }
    };

    useEffect(() => {
        loadPaymentSecrets();
    }, []);

    const setAsDefaultPaymentMethod = async (paymentMethodId) => {
        const response = await fetch(`${config.apiUrl}/payment/set-customer-default-payment-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId, paymentMethodId }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not save your payment method for bookings.');
        }
    };

    /** After Payment Sheet / SetupIntent, attach PM to customer and mark it default for bookings. */
    const finalizeSetupIntentOnServer = async (clientSecret) => {
        const { setupIntent, error } = await retrieveSetupIntent(clientSecret);
        if (error) {
            throw new Error(error.message || 'Could not verify card setup.');
        }
        const status = String(setupIntent?.status || '').toLowerCase();
        if (status !== 'succeeded') {
            throw new Error('Payment setup did not finish. Please try again.');
        }
        const paymentMethodId = setupIntent.paymentMethodId;
        if (!paymentMethodId) {
            throw new Error('No payment method was saved. Please try again.');
        }
        await setAsDefaultPaymentMethod(paymentMethodId);
    };

    const handleCardSetupSuccess = () => {
        Alert.alert(
            'Success',
            'Your payment method is successfully set up for future payments!',
            [{ text: 'OK', onPress: () => navigation.navigate('ProfileSettings') }]
        );
    };

    const walletPayLabel = Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay';

    /** Opens Stripe Payment Sheet — wallet pay, Link, and Skimatt-saved cards (not OS Keychain autofill). */
    const openSavedCardPicker = async () => {
        if (openingSavedCardPicker) return;
        setOpeningSavedCardPicker(true);
        Keyboard.dismiss();
        try {
            const secrets = await fetchPaymentSheetParams();
            setSetupIntentClientSecret(secrets.setupIntent);
            setEphemeralKey(secrets.ephemeralKey);

            const { error: initError } = await initPaymentSheetWithBilling(nameOnCard, secrets);
            if (initError) {
                Alert.alert('Unable to open saved cards', initError.message);
                return;
            }

            const { error } = await presentPaymentSheet();
            if (error) {
                if (error.code !== 'Canceled') {
                    Alert.alert('Unable to use saved card', error.message);
                }
                return;
            }
            await finalizeSetupIntentOnServer(secrets.setupIntent);
            handleCardSetupSuccess();
        } catch (error) {
            const msg = error?.message != null ? String(error.message) : 'Please try again.';
            Alert.alert('Unable to open saved cards', msg);
        } finally {
            setOpeningSavedCardPicker(false);
        }
    };

    const buildBillingDetails = (cardDetails) => {
        const billingDetails = {
            email: email || undefined,
            name: nameOnCard.trim() || undefined,
        };
        const postalCode =
            cardDetails?.postalCode != null ? String(cardDetails.postalCode).trim() : '';
        if (postalCode) {
            billingDetails.address = { postalCode, country: 'US' };
        }
        return billingDetails;
    };

    const handleAttachPaymentMethod = async () => {
        if (!paymentSheetReady) {
            Alert.alert('Please wait', 'Payment setup is still loading.');
            return;
        }
        if (submittingManualCard) return;

        const cardDetails = cardDetailsRef.current;
        if (!cardDetails?.complete) {
            Alert.alert(
                'Incomplete card',
                'Enter your card number, expiry, CVC, and ZIP/postal code in all fields shown.'
            );
            return;
        }
        if (!nameOnCard.trim()) {
            Alert.alert('Name required', 'Enter the name as it appears on your card.');
            return;
        }

        setSubmittingManualCard(true);
        Keyboard.dismiss();
        if (Platform.OS === 'android') {
            await new Promise((resolve) => setTimeout(resolve, 150));
        }

        try {
            const secrets = await fetchPaymentSheetParams();
            const clientSecret = secrets.setupIntent;
            setSetupIntentClientSecret(clientSecret);
            setEphemeralKey(secrets.ephemeralKey);

            const billingDetails = buildBillingDetails(cardDetails);

            const { error: pmError, paymentMethod } = await createPaymentMethod({
                paymentMethodType: 'Card',
                paymentMethodData: { billingDetails },
            });

            if (pmError) {
                Alert.alert(
                    'Card not accepted',
                    pmError.message || 'Please check your card details and try again.'
                );
                console.error('createPaymentMethod error', pmError);
                return;
            }

            const { error } = await confirmSetupIntent(clientSecret, {
                paymentMethodType: 'Card',
                paymentMethodData: {
                    paymentMethodId: paymentMethod.id,
                },
            });

            if (error) {
                Alert.alert(
                    'Error',
                    error.message ||
                        'There was an error attaching your payment method. Please try again.'
                );
                console.error('confirmSetupIntent error', error);
            } else {
                await setAsDefaultPaymentMethod(paymentMethod.id);
                handleCardSetupSuccess();
            }
        } catch (err) {
            const msg = err?.message != null ? String(err.message) : 'Please try again.';
            Alert.alert('Error', msg);
            console.error('handleAttachPaymentMethod error', err);
        } finally {
            setSubmittingManualCard(false);
        }
    };
    
    

    const [userData, setUserData] = useState({
        _id: '',
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        customerId: '',
        profileImage: ''
    });

    const [token, setToken] = useState('');

    const [nameOnCard, setNameOnCard] = useState('');
  
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const requestOptionsforCustomerIntent = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
            customerId: customerId
        })
    }
  
   
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
            alert('An error occurred while processing your request');
            navigation.navigate('EnterApp')
            }
            const userData = await userResp.json();
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUserData(userData);
        setLoading(false);
        console.log('Email:', email);
        console.log('User ID:', userId);
        console.log('Customer ID:', customerId);
        })();
    }, []);  
    
    const [loaded] = useFonts({
        effortless: require('../assets/fonts/effortless.regular.ttf'),
        bebesNeue: require('../assets/fonts/BebasNeue-Regular.ttf')
      });
    
      const scrollBottomPad = Math.max(insets.bottom, 16) + 24;

      if (!loaded) {
        return null;
      }

    return (
        <KeyboardAvoidingView style={styles.keyboardRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
             <View style={styles.container}>
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
        <View style={styles.titleContainerNum}>
            <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
            <MyText title={`Enter Card Details`} style={styles.addPaymentTitle} h2 />
            <MyText title={'Name on Card'} style={styles.h3} h3 />
                <View style={styles.cardContainer}>
                    <TextInput
                        style={styles.cardInput}
                        placeholder='Enter name as it appears on your card'
                        placeholderTextColor='#e8987c'
                        textContentType={Platform.OS === 'ios' ? 'creditCardName' : 'name'}
                        autoComplete={Platform.OS === 'android' ? 'cc-name' : 'name'}
                        importantForAutofill='yes'
                        autoCapitalize='words'
                        value={nameOnCard}
                        onChangeText={setNameOnCard}
                        required
                    />      
                </View>
                <MyText title={'Card Number, Expiry Date, and CVV'} style={styles.h3Card} h3 />

                <View style={[styles.cardContainer, styles.cardContainerField]}>
                        <CardField
                            ref={cardInputRef}
                            postalCodeEnabled={true}
                            countryCode="US"
                            placeholders={{
                                number: 'XXXX XXXX XXXX XXXX',
                                postalCode: 'ZIP / Postal code',
                            }}
                            cardStyle={{
                                textColor: '#c12818',
                                placeholderColor: '#A88168',
                                borderRadius: 2,
                                backgroundColor: '#c12818',
                            }}
                            style={styles.cardField}
                            onCardChange={(cardDetails) => {
                                cardDetailsRef.current = cardDetails;
                                setCardComplete(Boolean(cardDetails.complete));
                            }}
                        />
                </View>
                <Text style={styles.manualCardHint}>
                    {Platform.OS === 'android'
                        ? 'Tap the card number field — Android may suggest cards saved in your phone autofill settings. Include ZIP in the last field.'
                        : 'Include ZIP in the last field. On iPhone, enter card details manually (iOS does not autofill into this secure field).'}
                </Text>

                <View style={styles.orContainer}>
                    <View style={styles.lineSeparator} />
                    <View title={'or'} style={styles.orLabel}>
                        <Text style={styles.orText}>or</Text>
                    </View>
                    <View style={styles.lineSeparator} />
                </View>
                {/* <MyText title={'Or use a saved card'} style={styles.h3Section} h3 /> */}
                <TouchableOpacity
                    style={[
                        styles.savedCardButton,
                        (!paymentSheetReady || openingSavedCardPicker) && styles.savedCardButtonDisabled,
                    ]}
                    onPress={openSavedCardPicker}
                    disabled={!paymentSheetReady || openingSavedCardPicker}
                    accessibilityRole='button'
                    accessibilityLabel={`Use ${walletPayLabel} or Link`}
                >
                    {openingSavedCardPicker ? (
                        <ActivityIndicator color='#c12818' />
                    ) : (
                        <Text style={styles.savedCardButtonText}>Use {walletPayLabel} or Link</Text>
                    )}
                </TouchableOpacity>
                <Text style={styles.savedCardHint}>
                    Opens {walletPayLabel}, Stripe Link, or cards already on your Skimatt account. Cards saved in your phone autofill settings are not listed here — tap the card fields above for that (Android).
                </Text>

            <Text style={styles.error}>{error}</Text>

            <View style={styles.navButtonsContainer}>
                <BackButton navigation={navigation} screenName="AddPaymentMethod" />
                <TouchableOpacity
                    style={[styles.nextButton, (submittingManualCard || !cardComplete) && styles.nextButtonDisabled]}
                    onPress={handleAttachPaymentMethod}
                    disabled={submittingManualCard || !cardComplete}
                >
                    <View style={styles.buttonContents}>
                        {submittingManualCard ? (
                            <ActivityIndicator color='#c12818' />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>next</Text>
                                <FontAwesomeIcon icon={faArrowRight} size={22} style={styles.arrowIcons} />
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
            <View style={styles.ymIconContainer}>
                <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
            </View>
        </View>
        </ScrollView>
        </View>
        </TouchableWithoutFeedback>
        {isKeyboardVisible && (
          <TouchableOpacity style={styles.buttonContainer} onPress={handleDoneButton} />
        )}
      </KeyboardAvoidingView>
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
    keyboardRoot: {
        flex: 1,
        backgroundColor: '#c12818',
    },

    scroll: {
        flex: 1,
        backgroundColor: '#ffebd6',
    },

    scrollContent: {
        flexGrow: 1,
    },

    titleContainerNum: {
        margin: 0,
        flexGrow: 1,
        padding: 40,
        paddingTop: 20,
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
        paddingVertical: 10,
        color: '#c12818',
        backgroundColor: '#c12818',
        height: 50,
        alignContent: 'center',
        marginHorizontal: -40,
        paddingLeft: 30
    },

    h3: {
        textAlign:'left',
        paddingTop: 16,
        color: '#c12818',
    },

    h3Card: {
        textAlign: 'left',
        paddingTop: 18,
        marginBottom: 10,
        color: '#c12818',
    },

    h3Section: {
        textAlign: 'left',
        paddingVertical: 10,
        color: '#c12818',
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
        color: 'red',
        marginTop: 16,
        marginBottom: -10
    },
    
    button: {
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 50,
        fontSize: 25,
        fontWeight: 600,
        borderRadius: 50,

    },

    orText: {
        textAlign: 'center',
        color: '#c12818',
        fontSize: 16,
        fontWeight: 'normal',
        fontFamily: 'effortless',
    },
    lineSeparator: {
        backgroundColor: '#c12818',
        height: 1,
        width: 100,
        marginVertical: 10,
    },
    orLabel: {
        margin: 0,
        color: '#c12818',
        textAlign: 'center',
        fontSize: 20,
        paddingHorizontal: 8,
    },
    orContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 6,
    },
    
    ymIconContainer: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 8,
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
    

    buttonText: {
        margin: 0,
        textAlign: 'center',
        padding: 15,
        fontSize: 25,
        fontWeight: 'normal',
        fontFamily: 'effortless'
    },

    navButtonsContainer: {
        
        marginBottom: 8,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },

 
    buttonContents: {
        display: 'flex',
        marginHorizontal: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
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

    nextButtonDisabled: {
        opacity: 0.6,
    },

    cardContainerExpiryCvvText: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 300
    },

    cardContainerExpiryCvv: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 330
    },

    cardContainer: {
        borderWidth: 3,
        borderRadius: 6,
        marginVertical: 10,
        borderColor: '#c12818',
        overflow: 'hidden',
    },

    cardContainerField: {
        marginTop: 4,
        marginBottom: 6,
    },

    cardField: {
        width: '100%',
        height: Platform.OS === 'ios' ? 88 : 96,
    },

    
    cardInput: {
        backgroundColor: '#ffebd6',
        paddingHorizontal: 15,
        color: '#c12818',
        height: 50,
        borderRadius: 2,
        fontSize: 16
    },

    savedCardButton: {
        backgroundColor: '#e8987c',
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        borderWidth: 2,
        borderColor: '#68281B',
    },

    savedCardButtonDisabled: {
        opacity: 0.55,
    },

    savedCardButtonText: {
        fontFamily: 'bebesNeue',
        fontSize: 20,
        color: '#c12818',
        textAlign: 'center',
    },

    savedCardHint: {
        color: '#c12818',
        fontSize: 12,
        lineHeight: 16,
        marginTop: 6,
        marginBottom: 0,
        opacity: 0.9,
    },

    manualCardHint: {
        color: '#c12818',
        fontSize: 11,
        lineHeight: 14,
        marginTop: 2,
        marginBottom: 4,
        opacity: 0.85,
    },

    cardInputSmall: {
        backgroundColor: '#c12818',
        height: 50,
        paddingHorizontal: 20,
        marginTop: 10,
        width: 100,
        textAlign: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: '#ffebd6',
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
    
})

  // const openPaymentSheet = async () => {
    //     try {
    //         const { paymentMethodId, error } = await presentPaymentSheet();
    //         if (error) {
    //             alert(`Error code: ${error.code}`, error.message);
    //             navigation.navigate('ProfileSettings');
    //         } else {
    //             alert('Success', 'Your payment method is successfully set up for future payments!'); 
    //             // await getPaymentMethodId(customerId);
    //             navigation.navigate('ProfileSettings');
    //         }
    //     } catch (error) {
    //     console.error('Error presenting PaymentSheet:', error);
    //   }
    // };

    // const formatCardNumber = (input) => {
    //     // Remove all non-digit characters and trim the string
    //     const cleanInput = input.replace(/\D/g, '');
    
    //     // Add space after every 4 digits (for card number formatting)
    //     let formattedInput = '';
    //     for (let i = 0; i < cleanInput.length; i++) {
    //       if (i > 0 && i % 4 === 0) {
    //         formattedInput += ' ';
    //       }
    //       formattedInput += cleanInput[i];
    //     }
    
    //     return formattedInput;
    //   };
    //   const handleCardNumberChange = (input) => {
    //     const formattedNumber = formatCardNumber(input);
    //     setCardNumber(formattedNumber);
    //   };
    //   const handleCardNumberBlur = () => {
    //     // Remove spaces when setting the final card number in state
    //     const cleanNumber = cardNumber.replace(/\s/g, '');
    //     setCardNumber(cleanNumber);
    //   };
    //   const formatExpiryMonth = (month) => {
    //     // Remove non-digit characters from the input
    //     const cleanedText = month.replace(/[^0-9]/g, '');
    
    //     // Ensure the value is between 1 and 12
    //     const integerValue = parseInt(cleanedText, 10);
    //     const limitedValue = integerValue > 12 ? 12 : integerValue < 1 ? 1 : integerValue;
    
    //     // Format the limited value with a leading zero if it's a single digit
    //     return limitedValue < 10 ? `0${limitedValue}` : String(limitedValue);
    //   };
    //   const handleMonthBlur = () => {
    //     setExpiryMonth(formatExpiryMonth(expiryMonth));
    //   };
    //   const getCurrentYear = () => {
    //     return new Date().getFullYear();
    //   };
    
    //   const formatExpiryYear = (year) => {
    //     const cleanedText = year.replace(/[^0-9]/g, ''); // Remove non-digit characters
    //     const currentYear = getCurrentYear(); // Get the current year
    
    //     // Limit the input to the current year and future years
    //     const integerValue = parseInt(cleanedText, 10);
    //     const limitedValue = integerValue < currentYear ? currentYear : integerValue;
    //     return String(limitedValue);
    //   };
    
    //   const handleYearBlur = () => {
    //     setExpiryYear(formatExpiryYear(expiryYear));
    //   };