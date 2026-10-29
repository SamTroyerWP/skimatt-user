import React, {useState, useEffect, useContext} from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Linking, Alert, Share, ActivityIndicator } from 'react-native';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import BackButton from '../components/Buttons/BackButton';
import config from '../views/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import NavigationContext from '../context/NavigationContext'

const isZoomLink = (value = '') => /^(https?:\/\/|zoommtg:\/\/)/i.test(String(value).trim());

const extractZoomMeetingId = (value = '') => {
    const trimmed = String(value).trim();
    if (!trimmed) return '';

    const pathMatch = trimmed.match(/\/(?:j|wc)\/(\d{9,13})(?:[/?]|$)/i);
    if (pathMatch?.[1]) return pathMatch[1];

    const queryMatch = trimmed.match(/[?&](?:confno|mn)=(\d{9,13})/i);
    if (queryMatch?.[1]) return queryMatch[1];

    const anyDigitsMatch = trimmed.match(/\b\d{9,13}\b/);
    if (anyDigitsMatch?.[0]) return anyDigitsMatch[0];

    if (!isZoomLink(trimmed)) {
        const digitsOnly = trimmed.replace(/\D/g, '');
        return digitsOnly || trimmed;
    }

    return '';
};

export default function CodePage ({ route, navigation, item }) {
    
    const {userLoggedIn, setUserLoggedIn} = useContext(NavigationContext)

    const params = route.params || {};
    const {
        bookingId,
        classId: classIdParam,
        userId,
        bookingCode,
        _id,
        name,
        studioName,
        time,
        date,
        address,
        address2,
        cityState,
        zipcode,
        instructor,
        price,
        typeClassId,
        zoomUrl: zoomUrlParam,
    } = params;

    const effectiveClassId = classIdParam || _id;

    const [bookingData, setBookingData] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');

    const [userData, setUserData] = useState({
        _id: '',
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        profileImage: ''
      });

    const encodedBookingInfo = JSON.stringify({
    bookingId: bookingId, // Unique booking ID
    classId: effectiveClassId, // ID of the class
    userId: userId, // ID of the user who made the booking
    bookingCode: bookingCode
    // Other relevant booking information
    });

    const initialZoomUrl =
      zoomUrlParam != null ? String(zoomUrlParam).trim() : '';
    const [resolvedZoomUrl, setResolvedZoomUrl] = useState(initialZoomUrl);
    const [zoomDetailsReady, setZoomDetailsReady] = useState(!!initialZoomUrl);

    useEffect(() => {
      if (zoomUrlParam != null && String(zoomUrlParam).trim()) {
        setResolvedZoomUrl(String(zoomUrlParam).trim());
        setZoomDetailsReady(true);
      }
    }, [zoomUrlParam]);

    useEffect(() => {
      if (!effectiveClassId) {
        setZoomDetailsReady(true);
        return;
      }
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(`${config.apiUrl}/classes/${effectiveClassId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (!cancelled && data?.zoomUrl != null) {
            setResolvedZoomUrl(String(data.zoomUrl).trim());
          }
        } catch (_) {
          /* fall back to params / in-person layout */
        } finally {
          if (!cancelled) setZoomDetailsReady(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [effectiveClassId]);

    const zoomValue = resolvedZoomUrl.trim();
    const hasZoomLink = isZoomLink(zoomValue);
    const zoomMeetingId = extractZoomMeetingId(zoomValue);

    const handleZoomUrlPress = async () => {
        if (!hasZoomLink) return;
        const canOpen = await Linking.canOpenURL(zoomValue);
        if (canOpen) {
            Linking.openURL(zoomValue);
        }
    };

    const handleShareMeetingId = async () => {
        if (!zoomMeetingId) return;
        const message = `Zoom Meeting ID: ${zoomMeetingId}`;
        try {
            await Share.share({
                message,
                title: 'Skimatt Zoom Meeting ID',
            });
        } catch (e) {
            const msg = e?.message != null ? String(e.message) : '';
            if (!/cancel|dismiss/i.test(msg)) {
                Alert.alert('Unable to share', 'Please try again.');
            }
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
        setUserLoggedIn(false)
      }
      const userData = await userResp.json();
      await AsyncStorage.setItem('user', JSON.stringify(userData));


      setLoading(false);

      console.log('booking id', bookingId)
    })();
  }, []);



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
        <BackButton navigation={navigation} screenName="Bookings" />
        <View style={styles.titleTextContainer}>
            <MyText title="You've booked it!" style={styles.userInfo} p />
        </View>
        <View style={styles.codeCardContainer}>
            <View style={styles.codeCard}>
              <QRCode
                value={encodedBookingInfo} // Pass the data to be encoded as the QR code content
                // size={200}   // Set the size of the QR code
               />
               <MyText title={bookingCode} style={styles.codeText} h2 />
            </View>
        </View>
        <View style={styles.titleTextContainer}>
            <MyText title="Please present this QR/alphanumeric code to instructor at time of your pass" style={styles.bookingsText} p />
        </View>
        <View style={styles.mapCardContainer}>
            <View style={styles.bookingCardPast}>
                {!zoomDetailsReady ? (
                    <ActivityIndicator size="large" color="#C65F59" style={styles.zoomDetailsLoader} />
                ) : zoomValue ? (
                    <>
                        <Text style={styles.zoomClassInstruction}>
                            {hasZoomLink
                                ? 'Please click the link or copy the meeting ID to access this Zoom-only pass!'
                                : 'Please copy the meeting ID to access this Zoom-only pass!'}
                        </Text>
                        {hasZoomLink ? (
                            <TouchableOpacity onPress={handleZoomUrlPress}>
                                <Text style={styles.zoomLink}>Zoom Link</Text>
                            </TouchableOpacity>
                        ) : null}
                        {zoomMeetingId ? (
                            <View style={styles.zoomMeetingIdRow}>
                                <Text style={styles.zoomMeetingIdText}>
                                    Meeting ID: {zoomMeetingId}
                                </Text>
                                <TouchableOpacity
                                    style={styles.zoomCopyButton}
                                    onPress={handleShareMeetingId}
                                    accessibilityLabel="Share or copy meeting ID"
                                    accessibilityRole="button"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <FontAwesomeIcon icon={faCopy} size={22} color="#c12818" />
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </>
                ) : (
                    <>
                        <Image
                            style={styles.mapItImage}
                            source={require('../img/mapIcon.png')}
                        />
                        <Text style={styles.dateText}>{address}</Text>
                        {address2 ? (
                            <Text style={styles.dateText}>{address2}</Text>
                        ) : null}
                        <Text style={styles.dateText}>
                            {cityState} {zipcode}
                        </Text>
                        <TouchableOpacity
                            style={styles.bookItButton}
                            onPress={() => navigation.navigate('Map')}
                        >
                            <Text style={styles.bookItText}>Map It!</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    </View>
)

} 


const styles = StyleSheet.create({
titleContainerNum: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#C65F59',
    paddingTop: 60
},

titleTextContainer: {
    margin: 17,
    marginHorizontal: 46
},

h3: {
    textAlign:'left',
    paddingTop: 10
},

bookItButton: {
    alignItems: 'center',
    backgroundColor: '#C65F59',
    borderRadius: 50,
    marginVertical: 5,
    marginHorizontal: 10,
    paddingVertical: 5,
},

bookItText: {
    fontFamily: 'americanTypewriterBold',
    fontSize: 20,
    paddingHorizontal: 10
},

titleMessage: {
    marginVertical: 8,
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
    backgroundColor: '#c12818',
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
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginLeft: 20
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
},

userHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
},

bookingsButton: {
    color: '#7F5345',
    backgroundColor: '#c12818',
    height: 60,
    borderRadius: 50,
    padding: 5,
    width: 250
},

bookingsText: {
    textAlign: 'center',
    alignItems: 'center',
    fontSize: 20,
    fontWeight: 'normal',
    fontFamily: 'americanTypewriterBold'
},

bookingsContainer: {
    flex: 1,
    display: 'flex',
    marginVertical: 5,
    alignItems: 'center',
},

codeCardContainer: {
    display: 'flex',
    justifyContent: 'space-between'
},

mapItImage: {
    width: 70,
    height: 70,
    borderColor: '#A85035',
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center'
},

mapCardContainer: {
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'center',
    marginVertical: 15,
},

bookingCardPast: {
    textAlign: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30,
    borderColor: '#c12818',
    borderWidth: 5,
    marginHorizontal: 10
},

codeCard: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 30,
    borderColor: '#c12818',
    borderWidth: 5,
    marginHorizontal: 5
},

codeText: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold'
    
},



classText: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center'
},

dateText: {
    fontSize: 16,
    textAlign: 'center'
},

instructorText: {
    fontSize: 14,
    textAlign: 'center'
},

zoomClassInstruction: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
    fontFamily: 'aptosDisplayBold',
},

zoomLink: {
    color: 'blue',
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontSize: 20,
    marginTop: 5,
},

zoomMeetingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
},

zoomMeetingIdText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'americanTypewriterBold',
    flexShrink: 1,
},

zoomCopyButton: {
    marginLeft: 10,
    padding: 6,
    backgroundColor: '#fff',
},

zoomDetailsLoader: {
    marginVertical: 24,
},


})