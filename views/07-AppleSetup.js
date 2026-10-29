import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Modal, Text, TextInput, Button, TouchableOpacity, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview'; // Correct import
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { useStripe, useApplePay } from '@stripe/stripe-react-native'
import { MyText } from '../components/MyText'; // Ensure this component is properly exported
import { useFonts } from 'expo-font';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import config from './config';

export default function AppleSetup({ route, navigation }) {

    const { customerId, email, userId, token } = route.params;

    const [loading, setLoading] = useState(true);
    const webViewRef = useRef(null);
    const [webViewUrl, setWebViewUrl] = useState('');
    const { presentApplePay, confirmSetupIntent } = useStripe();
    const [clientSecret, setClientSecret] = useState('');

    const handleNavigationStateChange = (navState) => {
        if (navState.url === config.returnUrl) {
            navigateToProfileSettings();
            showAlert();
        }
    };

    useEffect(() => {
        initiateSetup();
    }, []); // Add empty dependency array to prevent infinite loop

    const initiateSetup = async () => {
        try {
          // Replace with your backend endpoint that generates Apple Pay setup URL
          const response = await fetch(`${config.apiUrl}/payment/apple-pay-setup`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ customerId: customerId }),
          });
          const { clientSecret } = await response.json();
          setClientSecret(clientSecret)
        } catch (error) {
            console.error('Error initiating setup:', error);
            Alert.alert('Error', error.message);
          } finally {
            setLoading(false);
          }
        };

    
  const handleApplePay = async () => {
    if (!clientSecret) {
      alert('Error', 'Client secret not set');
      return;
    }

    const { error, paymentMethod } = await presentApplePay({
      cartItems: [
        {
          label: 'Skimatt',
          amount: '1.00',
        },
      ],
      country: 'US',
      currency: 'USD',
    });

    if (error) {
      alert('Error', error.message);
      return;
    }

    const { setupIntent, error: confirmError } = await confirmSetupIntent(clientSecret, {
      paymentMethodType: 'Card',
      paymentMethodData: {
        billingDetails: {
          email: 'test@example.com',
          phone: '123-456-7890',
          address: {
            city: 'San Francisco',
            country: 'US',
            line1: '510 Townsend St',
            postal_code: '94103',
            state: 'CA',
          },
        },
      },
    });

    if (confirmError) {
      alert('Error', confirmError.message);
    } else if (setupIntent.status === 'succeeded') {
      alert('Success', 'Apple Pay setup completed successfully!');
      navigateToProfileSettings();
    }
  };


    const navigateToProfileSettings = () => {
        navigation.navigate('ProfileSettings');
    };

    const showAlert = () => {
        alert('PayPal payment method added successfully!');
    };

    const [loaded] = useFonts({
        effortless: require('../assets/fonts/effortless.regular.ttf'),
        bebesNeue: require('../assets/fonts/BebasNeue-Regular.ttf')
    });

    if (!loaded) {
        return null;
    }

    return (
        <View style={styles.container}>
        <View style={styles.titleContainerNum}>
          <View style={styles.titleTextContainer}>
            <MyText title={'Skimatt'} style={styles.ymTitle} h3 />
            <View style={styles.webViewContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : (
                <Button title="Setup Apple Pay" onPress={handleApplePay} />
              )}
            </View>
            <View style={styles.navButtonsContainer}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AddPaymentMethod")}>
                <View style={styles.buttonContents}>
                  <FontAwesomeIcon icon={faArrowLeft} size={22} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    titleContainerNum: {
        margin: 0,
        flex: 1,
        backgroundColor: '#fff',
    },
    titleTextContainer: {
        backgroundColor: 'black',
        paddingHorizontal: 15,
        paddingTop: 20,
    },
    ymTitle: {
        fontSize: 23,
        fontFamily: 'effortless',
        textAlign: 'center',
        color: '#c12818',
        marginBottom: 10,
    },
    webViewContainer: {
        borderWidth: 5,
        borderColor: '#c12818',
        padding: 13,
        borderRadius: 15,
        height: '85%',
    },
    navButtonsContainer: {
        marginVertical: 10,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginLeft: 20,
    },
    buttonContents: {
        display: 'flex',
        marginHorizontal: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    backButton: {
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 50,
        fontWeight: '600',
        borderRadius: 50,
        width: 50,
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
});