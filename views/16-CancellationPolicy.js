import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { MyText } from '../components/MyText';
import BackButton from '../components/Buttons/BackButton';
import { useFonts } from 'expo-font';
import config from './config';

export default function CancellationPolicy({ route, navigation }) {
  
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const { 
    bookingId,
    key, 
    _id,
    name,
    description,
    studioName,
    time,
    date,
    address,
    address2,
    cityState,
    zipcode,
    instructor,
    price,
    currency,
    typeClassId,
    providerId,
    profileImage,
    classId,
    maxParticipants,
    bookingIdFromBookings,
    bookingCodeFromBookings,
    startDate,
    endDate,
    sourcePage,
    duration,
    clickedMarker 
  } = route.params; 

  // const extractedBookingId = bookingId[0].replace(/"/g, '');

//   const [userData, setUserData] = useState({
//     _id: '',
//     email: '',
//     firstName: '',
//     lastName: '',
//     phoneNumber: '',
//     customerId: ''
//   });

const handleCancelBooking = async () => {
  // Perform cancellation request to the backend here
  // Example fetch or axios call to your cancelBooking endpoint
  // Make sure to replace 'bookingId' with the actual bookingId

  try {
    const response = await fetch(`${config.apiUrl}/bookings/${bookingId}`, {
      method: 'DELETE',
    });
    const data = await response.json()
    if (response.ok) {
      // Booking cancelled successfully, handle UI changes or navigation
      // For example, navigate back to a previous screen
      alert('Booking cancelled successfully.  Please check your payment account for a refund in the next 2-3 business days.')
      navigation.navigate('Profile')
    } else {
      // Handle error response from the backend
      // Display an error message or handle as needed
      console.error('Error cancelling booking:', data);
    }
  } catch (error) {
    // Handle network errors or other exceptions
    console.error('Error cancelling booking:', error);
  }
};

useEffect(() => {
  console.log('hello', bookingId,
    key, 
    _id,
    name,
    description,
    studioName,
    time,
    date,
    address,
    address2,
    cityState,
    zipcode,
    instructor,
    price,
    currency,
    typeClassId,
    providerId,
    profileImage,
    classId,
    maxParticipants,
    bookingIdFromBookings,
    bookingCodeFromBookings,
    startDate,
    endDate,
    sourcePage,
    duration,
    clickedMarker )
})

  // useEffect(() => {
  //   console.log('extracted booking id', extractedBookingId)
//     setLoading(true);
//     (async () => {
//     const token = await AsyncStorage.getItem('userToken');
//     setToken(token);

//     const userResp = await fetch(`${config.apiUrl}/users/get`, {
//       method: 'POST',
//       headers: {
//         Accept: 'application/json',
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ token }),
//     });
//     if (userResp.status !== 200) {
//       alert('An error occurred while processing your request');
//       navigation.navigate('EnterApp');
//     }
//     const userData = await userResp.json();
//     await AsyncStorage.setItem('user', JSON.stringify(userData));

//     console.log('userData:', userData);

//     setUserData(userData);
//     setLoading(false);
//     console.log(price)
//     console.log(currency)
//     console.log(providerId)
//     console.log(studioName)
    
   
//     const customerId = userData.customerId; // Replace with the actual customer ID
//     console.log('customerId:', customerId);
//     // Step 1: Fetch the default payment method ID from the backend
//     const response = await fetch(`${config.apiUrl}/payment/get-default-payment-method/${customerId}`);
//     const data = await response.json();

//     if (!response.ok) {
//       console.error('Error:', data.error);
//       return;
//     }

//     const defaultPaymentMethodId = data.defaultPaymentMethodId;
//     setDefaultPaymentMethodId(defaultPaymentMethodId);
//     console.log('defaultPaymentMethodId:', defaultPaymentMethodId);

//     const bookPrice = price;
//     const formattedPrice = formatPriceForStripe(bookPrice);
//     setFormattedPrice(formattedPrice);

//     console.log(_id);
//     console.log(userData._id)
//     // Check booking status
//     if (userData && userData._id) { // Ensure userData._id exists
//       console.log('booking user id', userData._id); // Log userData._id
//       console.log('booking pass id', _id)

//       await checkBooking();
//     }

//     await getCustomerIdByProviderId();
//     setDataLoaded(true);
//   })();
// }, []); // Empty dependency array to run only once



  const [loaded] = useFonts({
    bebesNeue: require('../assets/fonts/BebasNeue-Regular.ttf'),
    americanTypewriter: require('../assets/fonts/american-typewriter.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const policyItems = [
    'Cancel up to 12 hours before a pass for a full refund of in-app credit for a pass with the same provider you booked with.', 
    'Cancel less than 12 hours before the pass and your purchase is not refundable.'
  ];

  return (
    <ScrollView style={styles.container}>
      <MyText title={`CANCELLATION POLICY FOR PASSES`} style={styles.titlePolicy} h1 />
      <View style={styles.policyContainer}>
        {policyItems.map((item, index) => (
          <View key={index} style={styles.policyItem}>
            <Text style={styles.dot}>{'\u2022'}</Text>
            <Text style={styles.policyText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.cancelButtonContainer} onPress={toggleModal}>
        {bookingId ?
        <View style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Pass Cancellation</Text>
        </View>
        : null }
      </TouchableOpacity>
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to cancel?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#68281B' }]} onPress={handleCancelBooking}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#007AFF' }]} onPress={toggleModal}>
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.navButtonsContainer}>
        <BackButton navigation={navigation} screenName="ClassDescription"
          params= {{
            bookingId: bookingId,
            key: key,
            _id: _id,
            name: name,
            description: description,
            studioName: studioName,
            time: time,
            date: date,
            address: address,
            address2: address2,
            cityState: cityState,
            zipcode: zipcode,
            instructor: instructor,
            price: price,
            currency: currency,
            typeClassId: typeClassId,
            providerId: providerId,
            profileImage: profileImage,
            classId: classId,
            maxParticipants: maxParticipants,
            bookingIdFromBookings: bookingIdFromBookings,
            bookingCodeFromBookings: bookingCodeFromBookings,
            startDate: startDate,
            endDate: endDate,
            sourcePage: sourcePage,
            duration: duration,
            clickedMarker: clickedMarker,
            sourcePage: sourcePage
          }} 
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#ffebd6',
  },

  titlePolicy: {
    marginVertical: 10,
    textAlign: 'center',
    fontFamily: 'bebesNeue',
    fontSize: 20,
    margin: 5,
    padding: 10,
    marginTop: 50,
    fontWeight: 'bold',
    color: '#c12818',
  },

  policyContainer: {
    padding: 20,
    paddingRight: 1,
  },

  policyItem: {
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  dot: {
    marginRight: 5,
    fontSize: 14,
    lineHeight: 24,
  },

  policyText: {
    flex: 1,
    textAlign: 'left',
    fontSize: 14,
    lineHeight: 24,
    color: '#c12818',
  },

  cancelButtonContainer: {
    marginTop: 15,
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: '#68281B',
    height: 50,
    width: 330,
    fontSize: 25,
    fontWeight: 'normal',
    borderRadius: 50,
    padding: 15,
  },

  cancelButtonText: {
    textAlign: 'center',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: 'normal',
    fontFamily: 'americanTypewriter',
    color: '#fff',
    bottom: 5,
  },

  navButtonsContainer: {
    marginTop: 40,
    marginBottom: 35,
    marginHorizontal: 20,
    height: 60,
    justifyContent: 'flex-start',
  },

  ymIconContainer: {
    alignItems: 'center',
  },

  ymIcon: {
    width: 70,
    height: 70,
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },

  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },

  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  modalButton: {
    padding: 15,

    borderRadius: 50,
    marginHorizontal: 10
  },

  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});