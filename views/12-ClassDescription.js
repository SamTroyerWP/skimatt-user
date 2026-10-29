import React, {useContext, useEffect, useState} from 'react';
import { StyleSheet, View, Text, TextInput, Modal, ActivityIndicator, TouchableOpacity, Image, ScrollView, Linking, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendarAlt, faStar, faShareFromSquare } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import config from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButtonAltBlack from '../components/Buttons/BackButtonAltBlack';
import NavigationContext from '../context/NavigationContext';
import { useChat } from '../context/ChatContext';
import { useStripe, usePlatformPay } from '@stripe/stripe-react-native';
import moment from 'moment';
import { shareListingFromToken } from '../utils/classShare';

export default function ClassDescription({ route, navigation }) {

    const { setChatRecipient, setMySupabaseId, setShowChat, setHasBooking, hasBooking } = useChat();
    
    const stripe = useStripe();
    const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();

    const handleMessageProvider = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/providers/get-by-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      const provider = await response.json();

      if (response.ok && provider.supabaseId) {
        setChatRecipient({
          id: provider.supabaseId,
          name: (provider.resortName || provider.studioName) || provider.name,
        });
        
        console.log('Chat recipient set - Provider supabaseId:', provider.supabaseId, 'Provider name:', (provider.resortName || provider.studioName) || provider.name);
      } else {
        console.warn('Failed to fetch provider or no supabaseId found:', provider);
      }
      
    } catch (error) {
      console.error('Error fetching provider for chat:', error);
    }
  };

    useEffect(() => {
        (async () => {
        if (!(isPlatformPaySupported({ googlePay: {testEnv: true} }))) {
            alert('Google Pay is not supported.');
            return;
          }
        else {
            console.log('google pay is supported')
        }
        console.log( 
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
        );
      })();
      }, []);

    const [averageRating, setAverageRating] = useState('');
    const [ratingsAndReviews, setRatingsAndReviews] = useState([]);
    const [reviewError, setReviewError] = useState('');

    const { userLoggedIn, setUserLoggedIn } = useContext(NavigationContext)

    const {
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
        classId: classIdParam,
        maxParticipants,
        bookingIdFromBookings,
        bookingCodeFromBookings,
        startDate,
        endDate,
        sourcePage,
        duration,
        clickedMarker,
        zoomUrl,
        token: classTokenParam,
    } = route.params || {};

    /** Deep links / some navigations pass `_id` only; booking APIs need the class id. */
    const classId = classIdParam ?? _id;

    const [classShareToken, setClassShareToken] = useState(classTokenParam || '');
    const [resolvedZoomUrl, setResolvedZoomUrl] = useState(
      () => (zoomUrl != null ? String(zoomUrl).trim() : '')
    );

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  
    const openPaymentModal = () => {
        if (defaultPaymentMethodId) {
          setIsPaymentModalOpen(true);
        } else {
          Alert.alert(
            "No Payment Method Detected",
            `Please add a payment method to your Wallet to make a booking.`,
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Go to Wallet",
                onPress: () => navigation.navigate("Wallet"), // Replace "WalletPage" with your actual wallet screen name
              },
            ]
          );
        }
    };

    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
    };

    const isBookedFromBookingsPage = sourcePage === 'Bookings';
    const isMembership = sourcePage === 'Memberships';
    const isRetreat = sourcePage === 'Retreats';
    const isCancellationPolicy = sourcePage === 'CancellationPolicy';
    const isMembershipListing =
      isMembership || clickedMarker === 'Membership';
    const isShareableListing =
      !isRetreat && clickedMarker !== 'Retreat';

    useEffect(() => {
      if (zoomUrl != null && String(zoomUrl).trim()) {
        setResolvedZoomUrl(String(zoomUrl).trim());
      }
    }, [zoomUrl]);

    useEffect(() => {
      if (!classId || !isShareableListing) return;
      let cancelled = false;
      (async () => {
        try {
          const apiPath = isMembershipListing
            ? `${config.apiUrl}/memberships/${classId}`
            : `${config.apiUrl}/classes/${classId}`;
          const res = await fetch(apiPath);
          if (!res.ok) return;
          const data = await res.json();
          if (cancelled) return;
          if (data?.token && !classShareToken) {
            setClassShareToken(String(data.token));
          }
          if (data?.zoomUrl != null) {
            setResolvedZoomUrl(String(data.zoomUrl).trim());
          }
        } catch (_) {
          /* listing details optional */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [classId, isShareableListing, isMembershipListing, classShareToken]);

    const handleShareListing = () => {
      shareListingFromToken(
        classShareToken,
        {
          instructor,
          providerId,
          studioName,
        },
        { listingType: isMembershipListing ? 'membership' : 'class' }
      );
    };

    const currentDate = new Date(); // Get the current date

    // Calculate the date exactly one month from the current date
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());

    // Format the dates as strings
    const currentDateString = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;
    const nextMonthDateString = `${nextMonthDate.getMonth() + 1}/${nextMonthDate.getDate()}/${nextMonthDate.getFullYear()}`;

    const getTimeDisplay = (duration, startDate) => {
      const start = new Date(startDate); // Start date as a Date object
      let end = new Date(startDate); // Copy the start date
    
      switch (duration.toLowerCase()) {
        case 'day pass (1 day)':
          // Day pass: return only today's date
          return `${formatDate(start)} (Day Pass)`;
    
        case 'weekly (1 week)':
          // Weekly: add 7 days
          end.setDate(start.getDate() + 7);
          return `${formatDate(start)} - ${formatDate(end)} (Weekly)`;
    
        case 'monthly (1 month)':
          // Monthly: add 1 month
          end.setMonth(start.getMonth() + 1);
          return `${formatDate(start)} - ${formatDate(end)} (Monthly)`;
    
        case 'quarterly (3 months)':
          // Quarterly: add 3 months
          end.setMonth(start.getMonth() + 3);
          return `${formatDate(start)} - ${formatDate(end)} (Quarterly)`;
    
        case 'annual (1 year)':
          // Annual: add 1 year
          end.setFullYear(start.getFullYear() + 1);
          return `${formatDate(start)} - ${formatDate(end)} (Annual)`;
    
        default:
          // Default case for unknown duration
          return `${formatDate(start)} - Unknown duration`;
      }
    };
    
    // Helper function to format the date as MM/DD/YYYY
    const formatDate = (date) => {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    };

    const formatPriceForStripe = (price) => {
        const cents = Math.round(price * 100);
        return cents;
    }

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');

    const [clientSecret, setClientSecret] = useState('');

    const [formattedPrice, setFormattedPrice] = useState('');
    const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState('');
    const [defaultPaymentMethodLast4, setDefaultPaymentMethodLast4] = useState('');
    const [providerDefaultPaymentMethodId, setProviderDefaultPaymentMethodId] = useState('');
    const [providerCustomerId, setProviderCustomerId] = useState('');
    const [userData, setUserData] = useState({
        _id: '',
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        customerId: '',
        supabaseId: ''
      });

  
    const [isReviewForUserToProvider, setIsReviewForUserToProvider] = useState(false);
    const [ratingId, setRatingId] = useState('');

    const [dataLoaded, setDataLoaded] = useState(false);
    const [isBooked, setIsBooked] = useState(false);
    const [bookingId, setBookingId] = useState('');
    const [bookingCode, setBookingCode] = useState('');

    const [countryCode, setCountryCode] = useState('');

    // const firstBookingId = bookingId.length > 0 ? bookingId[0] : null;
    // const firstBookingCode = bookingCode.length > 0 ? bookingCode[0] : null;

    // setTimeout(() => {
    //     setDataLoaded(true);
    // }, 500);

    const currencyToCountryCode = {
        USD: 'US',
        EUR: 'EU',
        GBP: 'GB',
        ILS: 'IL'
        // Add more mappings as needed
      };

      const convertCurrencyToCountryCode = () => {
        // Convert currency code to uppercase for consistency
        const code = currency.toUpperCase();
      
        // Check if the currency code exists in the mapping
        if (currencyToCountryCode.hasOwnProperty(code)) {
          setCountryCode(currencyToCountryCode[code]);
          console.log(currencyToCountryCode[code]);
        } else {
          // Handle case where currency code is not found
          throw new Error(`Country code not found for currency code ${code}`);
        }
      };

    const checkBooking = async (userData, _id, bookingIdFromBookings, bookingCodeFromBookings ) => {
        if (userData._id && _id) {
            try {
                // Make a fetch request to your backend API to check if the user has booked the class
                const response = await fetch(`${config.apiUrl}/bookings?userId=${userData._id}&classId=${_id}`);
                const data = await response.json();
                // Parse the response JSON
                if (response.ok && data !== null && Object.keys(data).length > 0 ) {
                    setIsBooked(true);
                    setHasBooking(true);
                    console.log('there is a booking with id', data.map(item => item._id).join(', '))
                    setBookingId(data.map(item => item._id))
                    console.log('there is a booking with code', data.map(item => item.bookingCode).join(', '))
                    setBookingCode(data.map(item => item.bookingCode))
                } else if (isBookedFromBookingsPage) {
                    setIsBooked(true);
                    setHasBooking(true);
                    console.log('there is a booking with id', bookingIdFromBookings)
                    setBookingId(bookingIdFromBookings)
                    console.log('there is a booking with code', bookingCodeFromBookings)
                    setBookingCode(bookingCodeFromBookings)
                } else if (Object.keys(data).length < 1 || !isBookedFromBookingsPage) {
                    setIsBooked(false);
                    setHasBooking(false);
                    console.log('there is no booking for this pass yet')
                    setBookingId(null);
                }
                

                // If the response indicates that the user has booked the class, return true
                // Otherwise, return false
                return data;
            } catch (error) {
                // Handle any errors that occur during the fetch request
                console.error('Error checking booking:', error);
                setHasBooking(false);
                return false;
            }
        }
    };

    const decrementMaxParticipants = async (classId) => {
        try {
            let apiUrl = isRetreat ? `${config.apiUrl}/retreats` : `${config.apiUrl}/classes`;
            // Decrement the maxParticipants value
            const response = await fetch(`${apiUrl}/${classId}`);
            const classData = await response.json();
    
            let newMaxParticipants = maxParticipants - 1;

            const updateResponse = await fetch(`${apiUrl}/edit/${classId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...classData, maxParticipants: newMaxParticipants }), // Decrement maxParticipants by 1
            });

            const updateData = await updateResponse.json();
            console.log('Pass updated:', updateData);
        } catch (error) {
            console.error('Error updating pass:', error);
        }
    };

    const [applePayClicked, setApplePayClicked] = useState(false);
    const [googlePayClicked, setGooglePayClicked] = useState(false);
    const [cardClicked, setCardClicked] = useState(false);

    const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);

    const closePaymentMethodModal = async () => {
        setPaymentMethodModalOpen(false);
    }

    const handleMethodClicked = async () => {
        setPaymentMethodModalOpen(true);
        fetchPaymentIntent();

    }

    // const handleApplePayConfirm = async () => {
    //     handleApplePay();
    //     closePaymentMethodModal();
    // }

    // const handleGooglePayConfirm = async () => {
    //     handleGooglePay();
    //     closePaymentMethodModal();
    // }
    
    // const handleApplePayClick = async () => {
    //     setApplePayClicked(true);
    //     handleMethodClicked();
    //     closePaymentModal();
    // }

    // const handleGooglePayClick = async () => {
    //     setGooglePayClicked(true);
    //     handleMethodClicked();
    //     closePaymentModal();
    // }

    const handleCardClick = async () => {
        setCardClicked(true);
        handleMethodClicked();
        closePaymentModal();
        handleBookButtonClick();
    }

    const handleBookButtonClick = async () => {
        
        // if (applePayClicked) {
        
        // closePaymentModal(); // Close the modal
        // } else if (googlePayClicked) {

        // } else {
        
            try {
                
            //   Step 2: Use the payment method for payment
            const paymentResponse = await fetch(`${config.apiUrl}/payment/process-payment`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                customerId: userData.customerId,
                paymentMethodId: defaultPaymentMethodId,
                confirmWithoutRedirect: true,
                currency: currency,
                price: formattedPrice,
                providerCustomerId: providerCustomerId,
                providerDefaultPaymentMethodId: providerDefaultPaymentMethodId
                // Include any other necessary information for the payment
                }),
            });
        
            const paymentData = await paymentResponse.json();
            console.log(paymentData)
            if (paymentResponse.ok) {
                // Payment was successful
                console.log('Payment successful:', paymentData);

                const clientSecret = paymentData.paymentIntent.id;
                console.log(clientSecret)

                addBooking();
            } else {
                // Handle payment failure
                Alert.alert("Booking Unsuccessful",
                    "Booking was unsuccessful.  Please check payment method to make sure details are valid.",
                  {
                    text: "OK",
                    style: "cancel",
                  })
                console.error('Payment error:', paymentData.error);
            }
            } catch (error) {
              Alert.alert("Booking Unsuccessful",
                "Booking was unsuccessful.  Please check payment method to make sure details are valid.",
              {
                text: "OK",
                style: "cancel",
              })
            console.error('Fetch error:', error);
            }
        // }
      };

      // const handleApplePay = async () => {
      //   try {
      //     const { error, paymentMethod } = await stripe.presentApplePay({
      //       countryCode: countryCode, // Replace with your country code
      //       currencyCode: currency, // Replace with your currency code
      //       paymentSummaryItems: [
      //         {
      //           label: name,
      //           amount: price, // Replace with the actual amount in string format (cents)
      //         },
      //       ],
      //     });
    
      //     if (error) {
      //       console.error('Apple Pay error:', error);
      //       alert('Error', 'Failed to process Apple Pay');
      //       return;
      //     }
    
      //     // Payment method was created successfully, now confirm the Payment Intent
      //   //   const { clientSecret } = await fetchPaymentIntent(); // Replace with your function to fetch clientSecret
    
      //     const { paymentIntent, error: confirmError } = await stripe.confirmPaymentIntent({
      //       clientSecret: clientSecret,
      //       paymentMethodId: paymentMethod.id,
      //     });
    
      //     if (confirmError) {
      //       console.error('Payment Intent confirmation error:', confirmError);
      //       alert('Error', 'Failed to confirm payment intent');
      //       return;                                
      //     }
    
      //     console.log('Payment Intent confirmed:', paymentIntent);
      //     alert('Success', 'Payment completed successfully!');
      //   } catch (error) {
      //     console.error('Apple Pay processing error:', error);
      //     alert('Error', 'Failed to process Apple Pay');
      //   }
      // };

      // const handleGooglePay = async () => {
      //   try {
      //     const { error } = await confirmPlatformPayPayment(clientSecret, {
      //       googlePay: {
      //         testEnv: false, // Set to true for testing, false for production
      //         merchantName: 'Skimatt, Inc',
      //         merchantCountryCode: 'US',
      //         currencyCode: 'USD',
      //         billingAddressConfig: {
      //           isPhoneNumberRequired: true,
      //           isRequired: true,
      //         },
      //       },
      //     });
    
      //     if (error) {
      //       console.error('Google Pay confirmation error:', error);
      //       alert('Error', 'Failed to confirm Google Pay payment.');
      //       // Handle error gracefully, e.g., prompt user to retry or use another payment method
      //       return;
      //     }
    
      //     // Payment was confirmed successfully
      //     console.log('Google Pay payment confirmed successfully.');
      //     alert('Success', 'Google Pay payment confirmed successfully.');
      //   } catch (error) {
      //     console.error('Error processing Google Pay payment:', error);
      //     alert('Error', 'Failed to process Google Pay payment.');
      //   }
      // };
    
      const fetchPaymentIntent = async () => {
        try {
          const response = await fetch(`${config.apiUrl}/payment/create-payment-intent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: price*(100), // Replace with your amount in cents
              currency: currency, // Replace with your currency
            }),
          });
    
          const data = await response.json();
          setClientSecret(data.clientSecret);
          console.log('client secret', data.clientSecret);
        } catch (error) {
          console.error('Error fetching Payment Intent:', error);
          throw error;
        }
      };

      const [providerSupabaseId, setProviderSupabaseId] = useState('');

      const getProviderSupabaseId = async (providerId) => {
        try {
          const response = await fetch(`${config.apiUrl}/providers/get-by-id`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ providerId }),
          });
      
          const providerData = await response.json();
      
          if (response.ok && providerData && providerData.supabaseId) {
            console.log('Found provider supabaseId:', providerData.supabaseId);
            return providerData.supabaseId;
          } else {
            console.warn('No supabaseId found for provider');
            return null;
          }
        } catch (err) {
          console.error('Error fetching provider data:', err);
          return null;
        }
      };

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
    
          console.log('userData:', userData);
    
          setUserData(userData);
          setLoading(false);
          console.log(price)
          console.log(currency)
          console.log('provider id', providerId)
          console.log(studioName)
          console.log(profileImage)
          convertCurrencyToCountryCode();
         
          const mySupabaseId = userData.supabaseId
          if (mySupabaseId) {
            setMySupabaseId({
              id: mySupabaseId,
              name: `${userData.firstName} ${userData.lastName}`
            })
            console.log ('my supabase id is', mySupabaseId)
          }

          const customerId = userData.customerId; // Replace with the actual customer ID
          console.log('customerId:', customerId);
          if (customerId) {
            // Step 1: Fetch the default payment method ID from the backend
            const response = await fetch(`${config.apiUrl}/payment/get-default-payment-method/${customerId}`);
            const data = await response.json();
        
            if (!response.ok) {
                console.error('Error:', data.error);
            }
            console.log('data', data)
            const defaultPaymentMethodId = data.defaultPaymentMethodId;
            const defaultPaymentMethodLast4 = data.defaultPaymentMethodLast4;
            setDefaultPaymentMethodId(defaultPaymentMethodId);
            setDefaultPaymentMethodLast4(defaultPaymentMethodLast4);
            console.log('defaultPaymentMethodId:', defaultPaymentMethodId);
            console.log('defaultPaymentMethodLast4:', defaultPaymentMethodLast4)
          }
          const bookPrice = price;
          const formattedPrice = formatPriceForStripe(bookPrice);
          setFormattedPrice(formattedPrice);
    
         
          // Check booking status
          if (userData && userData._id) { // Ensure userData._id exists
            console.log('booking user id', userData._id); // Log userData._id
            console.log('booking pass id', classId)
            await checkBooking(userData, classId);
          }
          
          if (providerId) {
            const providerSupabaseId = await getProviderSupabaseId(providerId);
            if (providerSupabaseId) {
              setProviderSupabaseId(providerSupabaseId); // or however you want to store it
              console.log('Messaging can be initiated with this provider via Supabase ID:', providerSupabaseId);
              handleMessageProvider();
            }
          }

          const averageRatingsForProviderResp = await fetch(`${config.apiUrl}/ratings/get-details/${providerId}`, {
            method: 'GET',
          });
          
          const averageRatingsForProviderData = await averageRatingsForProviderResp.json();
          if (averageRatingsForProviderData.length > 0) {
            setRatingId(averageRatingsForProviderData[0]._id);
            console.log('ratings data', averageRatingsForProviderData);
            console.log('user id for ratings', averageRatingsForProviderData[0].userId);
            const ratingNumbers = averageRatingsForProviderData.map(rating => rating.ratingNumber);
            const totalRatings = ratingNumbers.length;
            const sumOfRatings = ratingNumbers.reduce((sum, rating) => sum + rating, 0);
            const averageRating = totalRatings > 0 ? (sumOfRatings / totalRatings).toFixed(2) : 0;
            setAverageRating(averageRating);
            setRatingsAndReviews(averageRatingsForProviderData);
        
            const userReviewForProvider = averageRatingsForProviderData.find(
              (rating) => rating.userId === userData._id && rating.providerId === providerId
            );

            if (userReviewForProvider) {
              setIsReviewForUserToProvider(true);
              console.log('There is an existing review for this provider from this user');
              setSelectedRating(userReviewForProvider.ratingNumber);
              setReview(userReviewForProvider.reviewContents);
            } else {
              setIsReviewForUserToProvider(false);
              setSelectedRating(null);
              setReview('');
              console.log('There is no existing review for this provider from this user');
            }
            console.log('average rating', averageRating);
          } else {
            setAverageRating(0);
            setRatingsAndReviews([]);
            setSelectedRating(null);
            setReview('');
          }

        //   await checkBooking();
          await getCustomerIdByProviderId();
          setDataLoaded(true);
          console.log('From Memberships Page', isMembership);
          console.log( 'From Retreats Page', isRetreat);
          console.log('From Booking Page', isBookedFromBookingsPage)
          console.log(clickedMarker)

          
        })();
      }, [key]); // Empty dependency array to run only once
    
    

      const getCustomerIdByProviderId = async () => {
        try {
            const customerIdResp = await fetch(`${config.apiUrl}/payment/get-customer-id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    providerId: providerId
                }),
            });
    
            if (customerIdResp.ok) {
                // Parse the JSON response
                const providerCustomerId = await customerIdResp.json();
                
                // Ensure that providerCustomerId is not undefined
             
                if (providerCustomerId) {
                    console.log('Providers Customer Id', providerCustomerId.customerId);
                    setProviderCustomerId(providerCustomerId.customerId) 
                    await getDefaultPaymentMethodProvider(providerCustomerId.customerId);
                    }
                    
        }} catch (error) {
            // Handle any errors that occur during the HTTP request
            console.error('Error:', error);
        }
    }

    const getDefaultPaymentMethodProvider = async (providerCustomerId) => {
        try {
            const providerDefaultPaymentMethodIdResp = await fetch(`${config.apiUrl}/payment/get-default-payment-method-provider/${providerCustomerId}`, {
            });
        
            if (providerDefaultPaymentMethodIdResp.ok) {
                // Parse the JSON response
                const providerDefaultPaymentMethodId = await providerDefaultPaymentMethodIdResp.json();
                // Set the state values
                console.log('Providers Default Payment Method Id', providerDefaultPaymentMethodId.defaultPaymentMethodId);
                setProviderDefaultPaymentMethodId(providerDefaultPaymentMethodId.defaultPaymentMethodId);
            } else {
                console.error('Error: Response data is undefined');
            }
        } catch (error) {
            // Handle any errors that occur during the HTTP request
            console.error('Error:', error);
        }
    }

    const generateBookingCode = () => {
        // Generate a random alphanumeric string of length 6 for the booking code
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let bookingCode = '';
        for (let i = 0; i < 6; i++) {
            bookingCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return bookingCode;
    };

    const addBooking = async () => {
        try {
            const bookingCode = generateBookingCode();
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData._id,
                    classId: classId,
                    bookingCode: bookingCode // Include the generated booking code
                })
            };

            const response = await fetch(`${config.apiUrl}/bookings/new`, requestOptions);
            const data = await response.json();
            const bookingId = data._id

            decrementMaxParticipants(classId);

            setHasBooking(true);
            setIsBooked(true);
            setBookingId(bookingId);
            setBookingCode(bookingCode);

            // Provider email + in-app message are sent by the server when the booking is created.

            // Reinitialize chat recipient to ensure chat is enabled
            await handleMessageProvider();
              
            // Optionally navigate to chat interface
            setShowChat(true); // Show ChatOverlay or chat UI
            
            navigation.navigate("CodePage", {
                _id: _id,
                name: name,
                studioName: studioName,
                time: time,
                date: date,
                address: address,
                address2: address2,
                cityState: cityState,
                zipcode: zipcode,
                instructor: instructor,
                price: price,
                typeClassId: typeClassId,
                bookingId: bookingId,
                classId: classId || _id,
                userId: userData._id,
                bookingCode: bookingCode,
                zoomUrl: resolvedZoomUrl,
                }    
            );
        } catch (error) {
            console.error('Error adding booking:', error);
            Alert.alert('Error', 'Failed to create booking. Please try again.');
        }
    }

    const handleNavigateToCancellationPolicy = async () => {
      
      navigation.navigate('CancellationPolicy', {
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
        clickedMarker: clickedMarker
      })
    }
    const handleNavigateToCodePage = async () => {
        navigation.navigate("CodePage", {
            _id: _id,
            name: name,
            studioName: studioName,
            time: time,
            date: date,
            address: address,
            address2: address2,
            cityState: cityState,
            zipcode: zipcode,
            instructor: instructor,
            price: price,
            typeClassId: typeClassId,
            bookingId: bookingId,
            classId: classId || _id,
            userId: userData._id,
            bookingCode: bookingCode,
            zoomUrl: resolvedZoomUrl,
        })
    }

    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [selectedRating, setSelectedRating] = useState(null);
    const [review, setReview] = useState('');
    const [isEditReviewMode, setIsEditReviewMode] = useState(false);
    const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
   
    const handleRating = async () => {
      setRatingModalVisible(true);
    }

    const handleRatingSelect = (rating) => {
      setSelectedRating(rating);
  };

    const handleEditMode = async () => {
        setIsEditReviewMode(true);
    }

    const handleReadReviews = async () => {
        setRatingModalVisible(false);
        setReviewsModalVisible(true);
    }

    const handleReviewSubmit = async () => {
      // Handle the submission of rating and review
      if ((!selectedRating || !review)) {
        setReviewError('Please select a rating AND write a review.')
      } else {
        setRatingModalVisible(false);
        const ratingsResp = await fetch(`${config.apiUrl}/ratings/new`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              ratingNumber: selectedRating,
              reviewContents: review,
              providerId: providerId,
              userId: userData._id.toString()
          })
        }); 
        
        const ratingsData = await ratingsResp.json();
        console.log('new rating submitted', ratingsData);

        // Step 1: Fetch the updated ratings data
        const updatedRatingsResp = await fetch(`${config.apiUrl}/ratings/get-details/${providerId}`, {
          method: 'GET',
        });
        
        const updatedRatingsData = await updatedRatingsResp.json();
        if (updatedRatingsData.length > 0) {
          const ratingNumbers = updatedRatingsData.map(rating => rating.ratingNumber);
          const totalRatings = ratingNumbers.length;
          const sumOfRatings = ratingNumbers.reduce((sum, rating) => sum + rating, 0);
          const updatedAverageRating = totalRatings > 0 ? (sumOfRatings / totalRatings).toFixed(2) : 0;

          // Step 2: Update the state
          setRatingsAndReviews(updatedRatingsData);
          setAverageRating(updatedAverageRating);
          setIsReviewForUserToProvider(true);
          setReviewError('');
          console.log('Updated average rating:', updatedAverageRating);
        }
      }
    };

    const handleShowDeleteModal = async () => {
        setIsDeleteModalVisible(true);
    }

    const handleReviewDelete = async () => {
      // Send request to delete the rating and review
      const response = await fetch(`${config.apiUrl}/ratings/delete/${ratingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
      });
    
      if (response.ok) {
        alert('Rating and Review deleted successfully');
        setRatingModalVisible(false);
        setIsDeleteModalVisible(false);
        
        // Reset isEditReviewMode to ensure it doesn’t persist
        setIsReviewForUserToProvider(false);
        
        // Step 1: Fetch updated ratings data to refresh the average rating and review list
        const updatedRatingsResp = await fetch(`${config.apiUrl}/ratings/get-details/${providerId}`, {
          method: 'GET',
        });
    
        const updatedRatingsData = await updatedRatingsResp.json();
        if (updatedRatingsData.length > 0) {
          const ratingNumbers = updatedRatingsData.map(rating => rating.ratingNumber);
          const totalRatings = ratingNumbers.length;
          const sumOfRatings = ratingNumbers.reduce((sum, rating) => sum + rating, 0);
          const updatedAverageRating = totalRatings > 0 ? (sumOfRatings / totalRatings).toFixed(2) : 0;
    
          // Step 2: Update the state with the latest ratings and average rating
          setRatingsAndReviews(updatedRatingsData);
          setAverageRating(updatedAverageRating);
          console.log('Updated average rating after deletion:', updatedAverageRating);
          setIsEditReviewMode(false);
        } else {
          // If no ratings left, set average rating and review data to default values
          setAverageRating(0);
          setRatingsAndReviews([]);
          setSelectedRating(null);
          setReview('');
          console.log('No Ratings left after deletion.');
        }
      }
    };

    const handleReviewSave = async () => {
        // Handle the submission of rating and review
        if ((!selectedRating || !review)) {
          setReviewError('Please select a rating AND write a review.')
        } else {
          setRatingModalVisible(false);
          const ratingsResp = await fetch(`${config.apiUrl}/ratings/edit/${ratingId}`, {
            method: 'PUT',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ratingNumber: selectedRating,
                reviewContents: review,
                providerId: providerId,
                userId: userData._id.toString()
            })
          }); 
          
          const ratingsData = await ratingsResp.json();
          console.log(ratingsData);
          setIsEditReviewMode(false);
          // Step 1: Fetch updated ratings data to refresh the average rating and review list
          const updatedRatingsResp = await fetch(`${config.apiUrl}/ratings/get-details/${providerId}`, {
            method: 'GET',
          });
          
          const updatedRatingsData = await updatedRatingsResp.json();
          if (updatedRatingsData.length > 0) {
            const ratingNumbers = updatedRatingsData.map(rating => rating.ratingNumber);
            const totalRatings = ratingNumbers.length;
            const sumOfRatings = ratingNumbers.reduce((sum, rating) => sum + rating, 0);
            const updatedAverageRating = totalRatings > 0 ? (sumOfRatings / totalRatings).toFixed(2) : 0;

            // Step 2: Update the state with the latest ratings and average rating
            setRatingsAndReviews(updatedRatingsData);
            setAverageRating(updatedAverageRating);
            setReviewError('');
            console.log('Updated average rating after edit:', updatedAverageRating);
          }
        }
      };

    const handleReviewsBack = () => {
      setReviewsModalVisible(false);
      setRatingModalVisible(true);
    }

    const handleCloseButtonFromRatings = () => {
      setRatingModalVisible(false);
      setReview('');
      setSelectedRating('')
      setReviewError('');
    }

    const handleCloseButtonFromReviews = () => {
        setReviewsModalVisible(false);
        setReviewError('');
    }

    const handleCloseButtonWithReview = () => {
        setRatingModalVisible(false);
        setReviewError('');
      }


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
    <ScrollView>
        {dataLoaded ?
        <View>
        <View style={styles.descriptionView}>
            <BackButtonAltBlack navigation={navigation} screenName='Map' />
            <View style={styles.desHeaderRow}>
            <View style ={styles.desContainer}>
            <Image style={styles.profileIcon} source={profileImage ? { uri: profileImage } : require ('../img/profile-user-invert.png')} />
                <TouchableOpacity style={styles.profileRatingButton} onPress={handleRating} >
                    <FontAwesomeIcon icon={faStar} size={10} />
                    {averageRating ? <Text style={styles.profileRatingText}> {averageRating}</Text> : <Text style={styles.profileRatingText}> --</Text> }
                </TouchableOpacity>
            </View>
            {isShareableListing && classShareToken ? (
              <View style={styles.shareClassButtonContainer}>
              <TouchableOpacity
                style={styles.shareClassButton}
                onPress={handleShareListing}
                accessibilityLabel={
                  isMembershipListing ? 'Share membership link' : 'Share pass link'
                }
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={styles.shareClassIconRing}>
                  <FontAwesomeIcon
                    icon={faShareFromSquare}
                    size={22}
                    color="#e8987c"
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.shareClassTextStack}>
                <Text style={styles.shareClassText}>Share this</Text>
                <Text style={styles.shareClassText}>
                  {isMembershipListing ? 'Membership!' : 'Pass!'}
                </Text>
              </View>
              </View>
            ) : null}
            </View>
                <MyText style={styles.providerName} title={studioName} h2 />
                <MyText style={styles.providerDetails} title={address}  />
                {address2 ?
                <MyText style={styles.providerDetails} title={address2} />
                : null }
                <MyText style={styles.providerDetails} title={`${cityState} ${zipcode}`} />

                {resolvedZoomUrl ? 
                    <MyText style={styles.providerDetails} title={`Zoom Availability: Yes`} />
                    :
                    <MyText style={styles.providerDetails} title={`Zoom Availability: No`} />
                }
              {/* <TouchableOpacity style={styles.messageButton} onPress={handleMessageProvider}>
                <Text style={styles.messageText}>Message Provider</Text>
              </TouchableOpacity> */}
        </View>
        { applePayClicked && (
            <Modal
            visible={paymentMethodModalOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={closePaymentMethodModal}
            >
                <View style={styles.methodModalContainer}>
                    <View style={styles.methodModalContent}>
                        <Text style={styles.checkoutText}>Checkout with:</Text>
                        
                            <View style={styles.paymentOptionButton} >
                                <Image style={styles.paymentIcon} source={require('../img/apple-pay.png')} />
                                <Text style={styles.paymentModalText}>Apple Pay</Text>
                            </View>
                            <Text style={styles.checkoutText}>Are you sure?</Text>
                            <View style={styles.bookItCancelContainer}>
                            <TouchableOpacity style={styles.methodModalBookItButton} onPress={handleApplePayConfirm}>
                                <Text style={styles.methodModalBookItText}>Buy Ticket!</Text>
                            </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelButton} onPress={closePaymentMethodModal}>
                                    <Text style={styles.closeButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>            
                    </View>
                </View>
            </Modal>
        )}

        {googlePayClicked && (
        <Modal
          visible={paymentMethodModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={closePaymentMethodModal}
        >
          <View style={styles.methodModalContainer}>
            <View style={styles.methodModalContent}>
              <Text style={styles.checkoutText}>Checkout with:</Text>

              <View style={styles.paymentOptionButton}>
                <Image style={styles.paymentIcon} source={require('../img/google-pay.png')} />
                <Text style={styles.paymentModalText}>Google Pay</Text>
              </View>

              <Text style={styles.checkoutText}>Are you sure?</Text>
              <View style={styles.bookItCancelContainer}>
                <TouchableOpacity style={styles.methodModalBookItButton} onPress={handleGooglePayConfirm}>
                  <Text style={styles.methodModalBookItText}>Buy Ticket!</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={closePaymentMethodModal}>
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

        <Modal
        visible={isPaymentModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.checkoutText}>Checkout with:</Text>
            {/* <View style={styles.appleGooglePayContainer}>
                <TouchableOpacity style={styles.paymentOptionButton} onPress={handleApplePayClick}>
                    <Image style={styles.paymentIcon} source={require('../img/apple-pay.png')} />
                    <Text style={styles.paymentModalText}>Apple Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymentOptionButton} onPress={handleGooglePayClick}>
                    <Image style={styles.paymentIcon} source={require('../img/google-pay.png')} />
                    <Text style={styles.paymentModalText}>Google Pay</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.orContainer}>
                <View style={styles.lineSeparator} />
                  <View title={'or'} style={styles.orLabel}>
                      <Text style={styles.orText}>or</Text>
                  </View>
                <View style={styles.lineSeparator} />
            </View> */}
            <View style={styles.defaultPaymentMethodContainer}>
                {/* <TouchableOpacity style={styles.paymentOptionButton} onPress={handleCardClick}> */}
                <TouchableOpacity style={styles.methodModalBookItButton} onPress={handleCardClick}>
                <Text style={styles.bookitText}>Buy Ticket!</Text>
                    <Image style={styles.paymentIcon} source={require('../img/credit-card.png')} />
                    <Text style={styles.paymentModalText}>Default Payment Method ({defaultPaymentMethodLast4})</Text>
                </TouchableOpacity>

            </View>
            <TouchableOpacity style={styles.closeButton} onPress={closePaymentModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

        <Modal
                visible={reviewsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReviewsModalVisible(false)}
            >
                <View style={styles.ratingModalContainer}>
                    <View style={styles.ratingModalContent}>
                        <Text style={styles.ratingModalTitle}>Reviews for {studioName}</Text>
                        <View style={styles.reviewsTextContainer}>
                            {ratingsAndReviews.map((review, _id) => (
                                <View style={styles.reviewsTextBorder}>
                                <Text key={review._id} style={styles.reviewsText}>
                                    "{review.reviewContents}"
                                </Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.backCloseButtonsContainer}>
                          <TouchableOpacity style={styles.submitButton} onPress={handleReviewsBack}>
                              <Text style={styles.submitButtonText}>Back</Text>
                          </TouchableOpacity>
                          <View style={styles.deleteEditReviewsContainer}>
                          </View>
                          <TouchableOpacity style={styles.closeButton} onPress={handleCloseButtonFromReviews}>
                              <Text style={styles.closeButtonText}>Close</Text>
                          </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                    <Text style={styles.modalTitle}>Confirm Rating/Review Deletion</Text>
                    <Text style={styles.modalMessage}>Are you sure you want to delete your rating and review?</Text>
                    <View style={styles.deleteModalButtons}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setIsDeleteModalVisible(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleReviewDelete}
                    >
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                    </View>
                </View>
                </TouchableOpacity>
                </View>
            </Modal>
            { !isReviewForUserToProvider ?
            <Modal
                visible={ratingModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setRatingModalVisible(false)}
            >
                <View style={styles.ratingModalContainer}>
                    <View style={styles.ratingModalContent}>
                        <Text style={styles.ratingModalTitle}>Rate and Review</Text>
                        <View style={styles.ratingButtonContainer}>
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <TouchableOpacity
                                    key={rating}
                                    style={[
                                        styles.ratingButton,
                                        selectedRating === rating && styles.selectedRatingButton
                                    ]}
                                    onPress={() => handleRatingSelect(rating)}
                                >
                                    <Text style={styles.ratingButtonText}>{rating}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Write a short review"
                            onChangeText={(text) => setReview(text)}
                            value={review}
                            maxLength={100}
                            multiline={true}
                            numberOfLines={3}
                            textAlignVertical='top'
                        />
                          <Text style={styles.charCount}>{review.length} / 100</Text>
                        </View>
                        <TouchableOpacity style={styles.submitButton} onPress={handleReviewSubmit}>
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                        {reviewError ? <Text style={styles.error}>{reviewError}</Text> : null}
                        <View style={styles.deleteEditReviewsContainer}>
                            <TouchableOpacity style={styles.editReviewsButton} onPress={handleReadReviews}>
                                <Text style={styles.submitButtonText}>Read Reviews</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={handleCloseButtonFromRatings}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            : 
            <Modal
                visible={ratingModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setRatingModalVisible(false)}
            >
                <View style={styles.ratingModalContainer}>
                    <View style={styles.ratingModalContent}>
                        <Text style={styles.ratingModalTitle}>Rate and Review</Text>
                        {!isEditReviewMode ?
                        <View style={styles.ratingButtonContainer}>
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <View
                                    key={rating}
                                    style={[
                                        styles.ratingButtonDisabled,
                                        selectedRating === rating && styles.selectedRatingButtonDisabled
                                    ]}
                                    onPress={() => handleRatingSelect(rating)}
                                >
                                    <Text style={styles.ratingButtonText}>{rating}</Text>
                                </View>
                            ))}
                        </View>
                        :

                        <View style={styles.ratingButtonContainer}>
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <TouchableOpacity
                                    key={rating}
                                    style={[
                                        styles.ratingButton,
                                        selectedRating === rating && styles.selectedRatingButton
                                    ]}
                                    onPress={() => handleRatingSelect(rating)}
                                >
                                    <Text style={styles.ratingButtonText}>{rating}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        }
                        {!isEditReviewMode ?

                        <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Write a short review"
                            onChangeText={(text) => setReview(text)}
                            value={review}
                            maxLength={100}
                            multiline={true}
                            numberOfLines={3}
                            textAlignVertical='top'
                            editable={false}
                        />
                          <Text style={styles.charCount}>{review.length} / 100</Text>
                        </View>
                        :
                        <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Write a short review"
                            onChangeText={(text) => setReview(text)}
                            value={review}
                            maxLength={100}
                            multiline={true}
                            numberOfLines={3}
                            textAlignVertical='top'
                        />
                          <Text style={styles.charCount}>{review.length} / 100</Text>
                        </View>
                        }
                        {!isEditReviewMode ?
                            <View style={styles.saveButtonInactive}>
                                <Text style={styles.saveButtonTextInactive}>Save</Text>
                            </View>
                        : 
                            <TouchableOpacity style={styles.saveButton} onPress={handleReviewSave}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        }
                        {reviewError? <Text style={styles.error}>{reviewError}</Text> : null}
                        <View style={styles.deleteEditReviewsContainer}>
                            <TouchableOpacity style={styles.deleteReviewsButton} onPress={handleShowDeleteModal}>
                                <Text style={styles.submitButtonText}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editReviewsButton} onPress={handleEditMode}>
                                <Text style={styles.submitButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editReviewsButton} onPress={handleReadReviews}>
                                <Text style={styles.submitButtonText}>Read Reviews</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={handleCloseButtonWithReview}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal> 
            }
        {isBooked || isBookedFromBookingsPage ?
            <View style={styles.wrapperData}>
           <MyText style={styles.lesson} title={name} h3 />
           <MyText style={styles.lessonType} title={description} h4 />
           {(isRetreat || clickedMarker === 'Retreat') ?
           <MyText style={styles.spanClassDes} title={`${moment(startDate).format('MMMM Do, YYYY')} - ${moment(endDate).format('MMMM Do, YYYY')}`} />
           :
           <MyText style={styles.spanClassDes} title={`${date} - ${time}`} />
           }
           <View style={styles.spanClassDesContainer}>
            <MyText style={styles.spanClassDesTitle} title={`Price: `} />
            <MyText style={styles.spanClassDes} title={`${price} (${currency})`} />
           </View>
     
           {clickedMarker === 'Membership' &&
                <Text style={styles.checkinText}>Pass Attendees</Text>
            } 
           {(isRetreat || clickedMarker === 'Retreat' || clickedMarker === 'Membership' || isMembership) ? null :
           <View style={styles.spanClassDesContainer}>
            <MyText style={styles.spanClassDesTitle} title={`Instructor: `} />
            <MyText style={styles.spanClassDes} title={`${instructor}`} />
           </View>
           }
        
           {/* <View style={styles.spanClassDesContainer}>
            <MyText style={styles.spanClassDesTitle} title={`Remaining Tickets: `} />
            <MyText style={styles.spanClassDes} title={`${maxParticipants}`} />
           </View> */}
         
           {/* <MyText style={styles.spanClassDesB} title={'(starting in 21 minutes)'} h3 /> */}
           <TouchableOpacity style={styles.checkBookingCodeButton} onPress={handleNavigateToCodePage}>
                <Text style={styles.bookedItText}>You've Booked It!</Text>
                <Text style={styles.checkBookingCodeText}>Check Booking Code</Text>
           </TouchableOpacity>
           <View style={styles.moreClassesMembershipsContainer}>

           <TouchableOpacity style={styles.moreClassButton} onPress={() => navigation.navigate('Calendar', {providerId: providerId})}>
              <View style={styles.moreClassTextCalendarContainer}>
              {(clickedMarker === 'Class' || (!isMembership && !isRetreat)) ?
                  <Text style={styles.moreClassText}>More Passes!</Text>
                  :
                  <Text style={styles.moreClassText}>See Passes!</Text>
                  }
                  <FontAwesomeIcon icon={faCalendarAlt} size={14} color='#e8987c' />
              </View>
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.moreClassButton} onPress={() => navigation.navigate('Memberships', {providerId: providerId})}>
           {(isMembership || clickedMarker === 'Membership') ?
              <Text style={styles.moreClassText}>More Memberships!</Text>
            :
              <Text style={styles.moreClassText}>See Memberships!</Text>
           }
           </TouchableOpacity>

           <TouchableOpacity style={styles.moreClassButton} onPress={() => navigation.navigate('Retreats', {providerId: providerId})}>
           {(isRetreat || clickedMarker === 'Retreat') ?
              <Text style={styles.moreClassText}>More Retreats!</Text>
            :
              <Text style={styles.moreClassText}>See Retreats!</Text>
           }
           </TouchableOpacity>
            </View>
           <TouchableOpacity style={styles.cancellationPolicyButton} onPress={handleNavigateToCancellationPolicy}>
                <Text style={styles.cancellationPolicyText}>Cancellation Policy</Text>
           </TouchableOpacity>
        </View>
        : 
        
        <View style={styles.wrapperData}>
           <MyText style={styles.lesson} title={name} h3 />
           <MyText style={styles.lessonType} title={description} h4 />
           { isRetreat || clickedMarker === 'Retreat' ? (
            <MyText style={styles.spanClassDes} title={`${moment(startDate).format('MMMM Do, YYYY')} - ${moment(endDate).format('MMMM Do, YYYY')}`} />
            ):
            
             !isMembership && clickedMarker !== 'Membership'  ? (
            <MyText style={styles.spanClassDes} title={`${date} - ${time}`} />
            ) : (
           <MyText style={styles.spanClassDes} title={getTimeDisplay(duration, currentDate)} />
           )}
           {/* } */}
           <View style={styles.spanClassDesContainer}>
            <MyText style={styles.spanClassDesTitle} title={`Price: `} />
            <MyText style={styles.spanClassDes} title={`${price} (${currency})`} />
           </View>
           {isMembership || clickedMarker === 'Membership' || isRetreat || clickedMarker === 'Retreat' ? null :
           <View style={styles.spanClassDesContainer}>
            <MyText style={styles.spanClassDesTitle} title={`Instructor: `} />
            <MyText style={styles.spanClassDes} title={`${instructor}`} />
           </View>
           }
           {/* <MyText style={styles.spanClassDesB} title={'(starting in 21 minutes)'} h3 /> */}
           { isCancellationPolicy || isMembership || maxParticipants > 0 || clickedMarker === 'Membership' ? (
                <TouchableOpacity style={styles.bookitButton} onPress={openPaymentModal}>
                        <Text style={styles.bookitText}>Buy Ticket!</Text>
                </TouchableOpacity>

                
            ) : (
                <TouchableOpacity style={styles.fullClassButton}> 
                    <Text style={styles.fullClassText}>Full Pass</Text>
                </TouchableOpacity>
            )}
            <View style={styles.moreClassesMembershipsContainer}>
            <TouchableOpacity style={styles.moreClassButton} onPress={() => navigation.navigate('Calendar', { providerId: providerId })}>
                <View style={styles.moreClassTextCalendarContainer}>
                  {clickedMarker === 'Class' || (!isMembership && !isRetreat) ?
                  <Text style={styles.moreClassText}>More Passes!</Text>
                  :
                  <Text style={styles.moreClassText}>See Passes!</Text>
                  }
                  <FontAwesomeIcon icon={faCalendarAlt} size={14} color='#e8987c' />
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreClassButton} onPress={() => navigation.navigate('Memberships', {providerId: providerId})}>
            {(isMembership || clickedMarker === 'Membership') ?
              <Text style={styles.moreClassText}>More Memberships!</Text>
            :
              <Text style={styles.moreClassText}>See Memberships!</Text>
           }
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreClassButton} onPress={() => navigation.navigate('Retreats', {providerId: providerId})}>
            {(isRetreat || clickedMarker === 'Retreat') ?
              <Text style={styles.moreClassText}>More Retreats!</Text>
            :
              <Text style={styles.moreClassText}>See Retreats!</Text>
           }
            </TouchableOpacity>
            </View>
           <TouchableOpacity style={styles.cancellationPolicyButton} onPress={handleNavigateToCancellationPolicy}>
                <Text style={styles.cancellationPolicyText}>Cancellation Policy</Text>
           </TouchableOpacity>
        </View>
        }
        
        </View>
            : 
            
            <View style={styles.modalPageBackground}>
                <View style={styles.loaderContainer}>
                <View style={styles.titleTextContainer}>
                <MyText title={'Skimatt'} style={styles.ymLoaderTitle} h3 />
                  <View style={styles.webViewContainer}>
                    <ActivityIndicator style={styles.loaderIcon} size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>Loading details for your selected pass...</Text>
                    <View style={styles.ymIconContainerWithinLoader}>
                      <Image style={styles.ymIconWithinLoader} source={require('../img/sm-icon red.png')} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
        }
    </ScrollView> 
      )  
}

const styles = StyleSheet.create({
    titleContainerNum: {
        margin: 0,
        flex: 1,
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
        color: '#fff',
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
        color: 'red',
        padding: 5,
        marginBottom: 10
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
        alignItems: 'center'
    }, 

    ymIcon: {
        width: 70,
        height: 70,
    },


    descriptionView: {
      display: 'flex',
      // height: 'auto',
      backgroundColor: '#c12818',
        
        
    },

    backImg: {
        width: 60,
        height: 60,
        position: 'absolute',
        marginTop: 20,
        marginLeft: 30,
    },

    desHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 8,
        paddingHorizontal: 16,
    },

    desContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
    },

    shareClassButtonContainer: {
        position: 'absolute',
        top: 8,
        right: 16,
        alignItems: 'center',
    },

    shareClassButton: {
        marginTop: 52,
        alignSelf: 'center',
    },

    shareClassIconRing: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#c12818',
        borderWidth: 3,
        borderColor: '#c12818',
    },

    shareClassTextStack: {
        alignItems: 'center',
        marginTop: 8,
    },

    shareClassText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 15,
        lineHeight: 18,
        textAlign: 'center',
        color: '#c12818',
    },

    providerPic: {
        marginTop: 20,
        width: 150,
        height: 150,
        borderRadius: 100
    },

    providerName: {
        textAlign: 'left',
        fontFamily: 'americanTypewriterBold',
        color: '#c12818',
        fontSize: 32,
        marginLeft: '5%',
        marginVertical: '1%'
    },

    providerDetails: {
        margin: 0,
        padding: .5,
        fontSize: 22,
        textAlign: 'left',
        color: '#c12818',
        marginLeft: '5%',
    },

    bookitButton: {
        marginHorizontal: 100,
        alignItems: 'center',
        marginTop: '5%',
        color: 'black',
        backgroundColor: '#e8987c',
        borderRadius: 50
    },

    bookitText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 35,
        paddingVertical: 10,
        alignItems: 'center',
    },

    fullClassButton: {
        marginHorizontal: 100,
        alignItems: 'center',
        marginTop: '5%',
        backgroundColor: 'lightgray',
        borderRadius: 50,
    },

    fullClassText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 35,
        paddingVertical: 10,
        color: 'gray',
        alignItems: 'center',
    },

    fullRetreatText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 30,
        paddingVertical: 10,
        color: 'gray',
        alignItems: 'center',
    },

    checkBookingCodeButton: {
        marginHorizontal: 20,
        alignItems: 'center',
        marginTop: '5%',
        color: 'black',
        backgroundColor: '#e8987c',
        borderRadius: 50
    },
    bookedItText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 25,
        paddingVertical: 10,
        alignItems: 'center',
    },
    checkBookingCodeText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 15,
        paddingBottom: 5,
        marginTop: -10,
        alignItems: 'center',
    },


    moreClassesMembershipsContainer: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      width: '100%',
    },

    moreClassButton: {
        alignItems: 'center',
        marginTop: '5%',
        color: 'black',
        backgroundColor: '#c12818',
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#e8987c',
    },

    moreClassTextCalendarContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 15
    },

    moreClassText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 17,
        color: '#c12818',
        paddingVertical: 10,
        paddingHorizontal: 10,
        alignItems: 'center',
        marginTop: 5
    },

    cancellationPolicyButton: {
        marginHorizontal: 120,
        alignItems: 'center',
        marginTop: '5%',
        marginVertical: 10,
        color: 'black',
        backgroundColor: '#e8987c',
        borderRadius: 50,
        marginBottom: 35
    },

    cancellationPolicyText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 15,
        color: '#000',
        paddingVertical: 10,
        alignItems: 'center',
    },

    messageButton: {
      marginHorizontal: 120,
      alignItems: 'center',
      marginTop: '5%',
      color: 'black',
      backgroundColor: '#e8987c',
      borderRadius: 50
  },

  messageText: {
      fontFamily: 'americanTypewriterBold',
      fontSize: 15,
      color: '#000',
      paddingVertical: 10,
      alignItems: 'center',
  },

    wrapperData: {
        borderColor: 'black',
        backgroundColor: '#c12818',
        display: 'flex',
        height: '100%',
    },

    lessonType: {
        fontFamily: 'americanTypewriterBold',
        textAlign: 'center',
        color: '#c12818',
        fontSize: 20,
        marginVertical: 10,
        paddingHorizontal: 10,
    },

    lesson: {
        fontFamily: 'americanTypewriterBold',
        textAlign: 'center',
        color: '#c12818',
        fontSize: 40,
        marginTop: 10,
    },

    spanClassDes: {
        fontSize: 20,
        textAlign: 'center',
        color: '#c12818',
    },

    spanClassDesTitle: {
        fontSize: 20,
        color: '#c12818',
        fontWeight: 800
    },

    spanClassDesContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },

    spanClassDesB: {
        fontSize: 20,
        textAlign: 'center',
        color: 'black',
        marginTop: '1%'
    },

    profileRatingButton: {
        backgroundColor: '#e8987c',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        paddingHorizontal: 10,
        borderRadius: 50,
        justifyContent: 'space-around'
    },

    profileRatingText: {
        textAlign: 'center',
        fontSize: 15,
        fontWeight: 'normal',
        fontFamily: 'americanTypewriterBold',
    },

    profileIcon: {
        height: 100,
        width: 100,
        margin: 20,
        marginTop: 50,
        borderRadius: 50
    },

  
            
      loader: {
        width: 50,
        height: 50,
        borderWidth: 5,
        borderColor: '#0000ff',
        borderTopColor: 'transparent',
        borderRadius: 25,
      },
      
      loadingText: {
        textAlign: 'center',
        fontFamily: 'bebesNeue',
        fontSize: 20,
        marginVertical: 30
      },

      modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  
  paymentOptionButton: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  
  cancelButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'grey',
    borderRadius: 5,
    alignItems: 'center',
    width: 120
  },

  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'grey',
    borderRadius: 5,
    paddingHorizontal: 80,
    alignItems: 'center',
  },

  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  
  paymentIcon: {
    width: 55,
    height: 35,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5        
  },

  googleIcon: {
    width: 45,
    height: 35,
    backgroundColor: '#000',
    borderWidth: 10,

  },

  checkoutText: {
    fontWeight: 'bold',
    fontSize: 20
  },

  appleGooglePayContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '35%',
    alignItems: 'center'
  },

  paymentModalText: {

    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 5
  },

  
    orContainer: {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginVertical: -12
    },

    lineSeparator: {
        backgroundColor: '#000',
        height: 1,
        width: 100,
        marginVertical: 10,
    },

    orLabel: {
        margin: 0,
        textAlign: 'center',
        fontSize: 20,
        padding: 20
    },

    orText: {
        fontWeight: 'bold',
        fontSize: 18
    },

    methodModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },

      methodModalContent: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 5,
      },

      bookItCancelContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
      },

      methodModalBookItButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: '5%',
        color: 'black',
        backgroundColor: '#e8987c',
        borderRadius: 20,
      },

      methodModalBookItText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 30,
        paddingVertical: 10,
        alignItems: 'center',
      },

      ratingModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    ratingModalContent: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center'
    },
    ratingModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    },
    ratingButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    ratingButton: {
        backgroundColor: '#e8987c',
        borderRadius: 50,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5
    },
    selectedRatingButton: {
        // backgroundColor: '#c97a5b',
        borderWidth: 3,
        borderColor: '#000',
    },

    ratingButtonDisabled: {
        backgroundColor: '#f2c0ad',
        borderRadius: 50,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5
    },
    selectedRatingButtonDisabled: {
        // backgroundColor: '#c97a5b',
        borderWidth: 3,
        borderColor: 'gray',
    },
    ratingButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    textInputContainer: {
      position: 'relative',
      width: '100%',
  },

  charCount: {
    position: 'absolute',
    bottom: 15,
    right: 1,
    color: 'gray',
},

    reviewInput: {
      width: 300,
      borderColor: 'gray',
      borderWidth: 1,
      marginVertical: 10,
      padding: 10,
      fontFamily: 'bebesNeue',
      fontSize: 18
  },

  backCloseButtonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },

  submitButton: {
      backgroundColor: '#e8987c',
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      width: '100%',
      textAlign:'center',
      marginBottom: 10
  },
  submitButtonText: {
      color: 'white',
      fontWeight: 'bold'
  },

  saveButtonInactive: {
    backgroundColor: 'lightgray',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    textAlign:'center'
  },

  saveButtonTextInactive: {
    color: 'gray',
    fontWeight: 'bold'
  },

  saveButton: {
    backgroundColor: '#e8987c',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    textAlign:'center'
  },

  saveButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },

  deleteReviewsButton: {
    backgroundColor: 'red',
    padding: 6,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    alignItems: 'center',

},

  editReviewsButton: {
    backgroundColor: '#e8987c',
    padding: 6,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },

  deleteEditReviewsContainer: {
    display: 'flex',
    flexDirection: 'row',
  },

  reviewsTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 10,

  },

  reviewsText: {
    fontFamily: 'americanTypewriterBold',
    marginVertical: 10,
    marginHorizontal: 35,
    textAlign: 'center',
  },

  reviewsTextBorder: {
    borderColor: '#000',
    borderWidth: 1,
    borderStyle: 'dotted',
    marginVertical: 5
  },

    closeButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%'
},
closeButtonText: {
    color: 'black',
    fontWeight: 'bold'
},


titleTextContainer: {
    paddingHorizontal: 15,
  },
  
  ymLoaderTitle: {
    fontSize: 23,
    fontFamily: 'effortless',
    textAlign: 'center',
    color: '#c12818',
    marginBottom: 10,
  },
  
  ymIconContainerWithinLoader: {
    flex:1,
    marginTop: 60,
    alignItems: 'center'
  }, 
  
  ymIconWithinLoader: {
    width: 70,
    height: 70,
  },

  modalPageBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: '#ffebd6',
    height: '100%',  
  },

  
  loaderContainer: {
    height: 925,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loader: {
    width: 50,
    height: 50,
    borderWidth: 5,
    borderColor: '#0000ff',
    borderTopColor: 'transparent',
    borderRadius: 25,
  },
  
  loaderIcon: {
    marginVertical: 130,
  },
  
  loadingText: {
    textAlign: 'center',
    fontFamily: 'bebesNeue',
    fontSize: 20,
    marginTop: -75
  },
  
  webViewContainer: {
    borderWidth: 5,
    borderColor: '#68281B',
    backgroundColor: '#c12818',
    padding: 13,
    borderRadius: 15,
    height: 700,
    width: 350,
  },
  
  titleTextContainer: {
    paddingHorizontal: 15,
  },
  
  ymLoaderTitle: {
    fontSize: 23,
    fontFamily: 'effortless',
    textAlign: 'center',
    color: '#c12818',
    marginBottom: 10,
  },
  
  ymIconContainerWithinLoader: {
    flex:1,
    marginTop: 60,
    alignItems: 'center'
  }, 
  
  ymIconWithinLoader: {
    width: 70,
    height: 70,
  },

  
//   buttonText: {
//     textAlign: 'center',
//     padding: 7,
//     width: 36,
//     fontSize: 12,
//     fontFamily: 'americanTypewriterBold',
//     fontWeight: 'bold',
//     borderColor: '#000',
//     borderWidth: 3,
//     borderRadius: 50
//   },

//   deleteButtonText: {
//     fontSize: 16,
//     color: '#000',
//     textAlign: 'center',
//     borderColor: '#c12818',
//     borderWidth: 3,
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderRadius: 25
//   },

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

  defaultPaymentMethodContainer: {
    marginBottom: 30,
  }
});