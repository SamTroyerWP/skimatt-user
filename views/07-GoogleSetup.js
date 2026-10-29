import React, { useEffect, useState } from 'react';
import { View, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { useStripe, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import config from '../views/config';

export default function GoogleSetup({ route, navigation }) {

  const { customerId } = route.params;

  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState(null);
  const stripe = useStripe();

  useEffect(() => {
    initiateSetup();
  }, []);

  const initiateSetup = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/payment/google-pay-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();
      const receivedClientSecret = data.clientSecret; // Store the received clientSecret
      console.log(receivedClientSecret)
      setClientSecret(receivedClientSecret); // Update the clientSecret state

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Skimatt, Inc.',
        googlePay: true, // Enable Google Pay
      });

      if (!error && data) {
        setLoading(false);
        await openPaymentSheet();
      } else {
        alert('Error', error.message);
      }
    } catch (error) {
      alert('Error', error.message);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    console.log('hello')
    if (error) {
      alert('Error', error.message);
      console.log('setup intent error', error)
    } else {
      alert('Success', 'Google Pay setup completed successfully!');
      navigation.navigate('ProfileSettings');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={styles.container}>
      <Button title="Set up Google Pay" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// import React, { useEffect, useState } from 'react';
// import { View, StyleSheet, Button, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
// import { useStripe, GooglePayButton, GooglePayEnvironment } from '@stripe/stripe-react-native';
// import { MyText } from '../components/MyText'; // Ensure this component is properly exported
// import { useFonts } from 'expo-font';
// import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
// import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
// import config from './config';


// export default function GoogleSetup({ route, navigation }) {

//   const { customerId, token } = route.params;

//   const [loading, setLoading] = useState(true);
//   const [clientSecret, setClientSecret] = useState(null);
//   const { createGooglePayPaymentMethod } = useStripe();

//   useEffect(() => {
//     initiateSetup();
//   }, []);

//   const initiateSetup = async () => {
//     try {
//       console.log('customer', customerId)

//       const response = await fetch(`${config.apiUrl}/payment/google-pay-setup`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ customerId }),
//       });

//       const { clientSecret } = await response.json();
//       setClientSecret(clientSecret);
//     } catch (error) {
//       console.error('Error initiating setup:', error);
//       alert('Error', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGooglePayPress = async () => {
//     if (!clientSecret) {
//       alert('Error', 'Client secret not set');
//       return;
//     }

//     const { error, paymentMethod } = await createGooglePayPaymentMethod({
//       amount: 100,
//       currencyCode: 'USD',
//       environment: GooglePayEnvironment.Test,
//     });

//     if (error) {
//       alert('Error', error.message);
//       return;
//     }

//     const { error: confirmError } = await stripe.confirmSetupIntent(clientSecret, {
//       paymentMethodId: paymentMethod.id,
//     });

//     if (confirmError) {
//       alert('Error', confirmError.message);
//     } else {
//       alert('Success', 'Google Pay setup completed successfully!');
//       navigation.navigate('ProfileSettings');
//     }
//   };

//   const [loaded] = useFonts({
//     effortless: require('../assets/fonts/effortless.regular.ttf'),
//     bebesNeue: require('../assets/fonts/BebasNeue-Regular.ttf')
// });

// if (!loaded) {
//     return null;
// }

//   return (
//       <View style={styles.container}>
//         <View style={styles.titleContainerNum}>
//           <View style={styles.titleTextContainer}>
//             <MyText title={'Skimatt'} style={styles.ymTitle} h3 />
//             <View style={styles.webViewContainer}>
//               {loading ? (
//                 <ActivityIndicator size="large" color="#0000ff" />
//               ) : (
//                 <GooglePayButton
//                 //   type={GooglePayButtonType.Pay}
//                   onPress={handleGooglePayPress}
//                 //   environment={GooglePayEnvironment.Test}
//                   style={styles.payButton}
//                 />
//               )}
//             </View>
//             <View style={styles.navButtonsContainer}>
//               <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AddPaymentMethod")}>
//                 <View style={styles.buttonContents}>
//                   <FontAwesomeIcon icon={faArrowLeft} size={22} />
//                 </View>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </View>
//   );
// }

// const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//     },
//     titleContainerNum: {
//       margin: 0,
//       flex: 1,
//       backgroundColor: '#fff',
//     },
//     titleTextContainer: {
//       backgroundColor: 'black',
//       paddingHorizontal: 15,
//       paddingTop: 20,
//     },
//     ymTitle: {
//       fontSize: 23,
//       fontFamily: 'effortless',
//       textAlign: 'center',
//       color: '#c12818',
//       marginBottom: 10,
//     },
//     webViewContainer: {
//       borderWidth: 5,
//       borderColor: '#c12818',
//       padding: 13,
//       borderRadius: 15,
//       height: '85%',
//     },
//     navButtonsContainer: {
//       marginVertical: 10,
//       display: 'flex',
//       justifyContent: 'space-between',
//       flexDirection: 'row',
//       marginLeft: 20,
//     },
//     buttonContents: {
//       display: 'flex',
//       marginHorizontal: 15,
//       alignItems: 'center',
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//     },
//     backButton: {
//       color: '#7F5345',
//       backgroundColor: '#c12818',
//       height: 50,
//       fontWeight: '600',
//       borderRadius: 50,
//       width: 50,
//       alignItems: 'center',
//       padding: 20,
//     },
//     payButton: {
//       width: '100%',
//       height: 50,
//     },
//   });