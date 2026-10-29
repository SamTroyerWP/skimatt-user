import React, {useState, useEffect, useContext} from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faArrowLeft, faEllipsis, faEllipsisH, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import BackButton from '../components/Buttons/BackButton';
import config from '../views/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import NavigationContext from '../context/NavigationContext';

export default function Bookings({ navigation }) {
    
    const { userLoggedIn, setUserLoggedIn } = useContext(NavigationContext);
    const insets = useSafeAreaInsets();

    const [categorizedBookingData, setCategorizedBookingData] = useState([]);
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

    const [activeTab, setActiveTab] = useState('Classes'); // Default selection is Classes

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
          setUserData(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));


        
          if (token) {
            try {
                const bookingsResp = await fetchBookings(token);
                setBookingData(bookingsResp);
                setLoading(false);          
            } catch (error) {
                console.error('Error fetching bookings:', error);
            }

            // const bookingsClassResp = await fetch(`${config.apiUrl}/bookings/user`, {
            //     method: 'POST',
            //     headers: {
            //         'Accept': 'application/json',
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ token }),
            // });
        
            // const bookingsClassData = await bookingsClassResp.json();
            // setBookingData(bookingsClassData)
            // setLoading(false);
          }
        })();
      }, []);

      const fetchBookings = async (token) => {
        try {
            // Fetch bookings based on the selected type
            const resp = await fetch(`${config.apiUrl}/bookings/user`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });
            const allBookings = await resp.json();
            // Categorize the bookings
            const categorizedBookings = await Promise.all(allBookings.map(async (booking) => {
                const bookingType = await getCategorizedBookingType(booking.classId);
                return { ...booking, bookingType };
            }));

            setCategorizedBookingData(categorizedBookings)
            return categorizedBookings;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }
    };

    const getCategorizedBookingType = async (classId) => {
        try {
            // Check if the classId corresponds to a class
            if (await isClass(classId)) {
                return 'Class';
            }
    
            // Check if the classId corresponds to a retreat
            if (await isRetreat(classId)) {
                return 'Retreat';
            }
    
            // Check if the classId corresponds to a membership
            if (await isMembership(classId)) {
                return 'Membership';
            }
    
            // If the type cannot be determined, return null or throw an error
            return null;
        } catch (error) {
            console.error('Error determining booking type:', error);
            throw error;
        }
    };

    const isClass = async (classId) => {
        try {
            // Implement your logic to check if the classId exists in the classes collection
            const response = await fetch(`${config.apiUrl}/classes/${classId}`);
            const classData = await response.json();
            return !!classData; // Return true if classData exists
        } catch (error) {
            console.error('Error checking if pass exists:', error);
            throw error;
        }
    };
    
    const isRetreat = async (classId) => {
        try {
            // Implement your logic to check if the classId exists in the retreats collection
            const response = await fetch(`${config.apiUrl}/retreats/${classId}`);
            const retreatData = await response.json();
            return !!retreatData; // Return true if retreatData exists
        } catch (error) {
            console.error('Error checking if retreat exists:', error);
            throw error;
        }
    };
    
    const isMembership = async (classId) => {
        try {
            // Implement your logic to check if the classId exists in the memberships collection
            const response = await fetch(`${config.apiUrl}/memberships/${classId}`);
            const membershipData = await response.json();
            return !!membershipData; // Return true if membershipData exists
        } catch (error) {
            console.error('Error checking if membership exists:', error);
            throw error;
        }
    };
    
    //   const filteredBookings = bookingData.filter(booking => booking.type === activeTab);

      const handleTabChange = (tab) => {
        setActiveTab(tab);
        console.log(activeTab)
      };

      const renderItemUpcoming = ({ item }) => {
        // Parse class date and time strings using Moment.js
        const classDateTime = moment(`${item.date} ${item.time}`, 'MMMM DD, YYYY hh:mm A');
        // Get the current date and time
        const currentDateTime = moment();
        
        // Compare with the current date and time
        if (classDateTime.isSameOrAfter(currentDateTime)) {
            return (
                <TouchableOpacity style={styles.bookingCardUpcoming} onPress={() => {
                    navigation.navigate('ClassDescription', { 
                        key: Math.random().toString(),
                        bookingIdFromBookings: item._id,
                        classId: item.classId,
                        name: item.name,
                        type: item.type,
                        description: item.description,
                        studioName: (item.resortName || item.studioName),
                        time: item.time,
                        date: item.date,
                        address: item.address,
                        address2: item.address2,
                        cityState: item.cityState,
                        zipcode: item.zipcode,
                        instructor: item.instructor,
                        price: item.price,
                        currency: item.currency,
                        typeClassId: item.typeClassId,
                        providerId: item.providerId,
                        profileImage: item.profileImage,
                        zoomUrl: item.zoomUrl,
                        bookingCodeFromBookings: item.bookingCode,
                        maxParticipants: item.maxParticipants,
                        sourcePage: 'Bookings' // Pass the source page as a parameter
                    })
                }}
                >
                    <Text style={styles.classText}>{item.name}</Text>
                    <Text style={styles.dateText}>{`${(item.resortName || item.studioName)}`}</Text>
                    <Text style={styles.dateText}>{`${item.date} (${item.time})`}</Text>
                    <Text style={styles.instructorText}>Instructor: {item.instructor}</Text>
                </TouchableOpacity>
            )
        } else {
            return null;
        }
    }

        // Filter only upcoming retreats
    const upcomingRetreats = categorizedBookingData.filter(item => {
        const classDateTime = moment(`${item.startDate}`, 'MMMM DD, YYYY');
        const currentDateTime = moment();
        return classDateTime.isSameOrAfter(currentDateTime);
    });

    const renderRetreatsUpcoming = ({ item }) => {
        
            console.log('retreat upcoming', item)
            // Parse class date and time strings using Moment.js
            const classDateTime = moment(`${item.startDate}`, 'MMMM DD, YYYY');
            // Get the current date and time
            const currentDateTime = moment();
            
            // Compare with the current date and time
            if (classDateTime.isSameOrAfter(currentDateTime)) {
                return (
                    <TouchableOpacity style={styles.bookingCardUpcoming} onPress={() => {
                        navigation.navigate('ClassDescription', { 
                            key: Math.random().toString(),
                            bookingIdFromBookings: item._id,
                            classId: item.classId,
                            name: item.name,
                            type: item.type,
                            description: item.description,
                            studioName: (item.resortName || item.studioName),
                            time: item.time,
                            startDate: item.startDate,
                            endDate: item.endDate,
                            address: item.address,
                            address2: item.address2,
                            cityState: item.cityState,
                            zipcode: item.zipcode,
                            instructor: item.instructor,
                            price: item.price,
                            currency: item.currency,
                            typeClassId: item.typeClassId,
                            providerId: item.providerId,
                            profileImage: item.profileImage,
                            zoomUrl: item.zoomUrl,
                            bookingCodeFromBookings: item.bookingCode,
                            maxParticipants: item.maxParticipants,
                            sourcePage: 'Bookings' // Pass the source page as a parameter
                        })
                    }}
                    >
                        <Text style={styles.classText}>{item.name}</Text>
                        <Text style={styles.dateText}>{`${(item.resortName || item.studioName)}`}</Text>
                        <Text style={styles.dateText}>{`${item.startDate} - ${item.endDate}`}</Text>
                        {/* <Text style={styles.instructorText}>Instructor: {item.instructor}</Text> */}
                    </TouchableOpacity>
                )
            } else {
                return null;
            }
        
    }

          // Filter only upcoming retreats
          const pastRetreats = categorizedBookingData.filter(item => {
            const classDateTime = moment(`${item.startDate}`, 'MMMM DD, YYYY');
            const currentDateTime = moment();
            return classDateTime.isBefore(currentDateTime);
        });
    const renderRetreatsPast = ({ item }) => {
      
        // Parse class date and time strings using Moment.js
        const classDateTime = moment(`${item.startDate}`, 'MMMM DD, YYYY');

        // Get the current date and time
        const currentDateTime = moment();

        // Compare with the current date and time
        if (classDateTime.isBefore(currentDateTime)) {
            return (
                <View style={styles.bookingCardPast} 
                // onPress={() => navigation.navigate("ClassDescription", {
                //     key: Math.random().toString(),
                //     _id: item._id,
                //     name: item.name,
                //     type: item.type,
                //     description: item.description,
                //     studioName: (item.resortName || item.studioName),
                //     time: item.time,
                //     date: item.date,
                //     address: item.address,
                //     address2: item.address2,
                //     cityState: item.cityState,
                //     zipcode: item.zipcode,
                //     instructor: item.instructor,
                //     price: item.price,
                //     currency: item.currency,
                //     typeClassId: item.typeClassId,
                //     providerId: item.providerId
                //     })}
                >
                    <Text style={styles.classText}>{item.name}</Text>
                    <Text style={styles.dateText}>{`${(item.resortName || item.studioName)}`}</Text>
                    <Text style={styles.dateText}>{`${item.startDate} - ${item.endDate}`}</Text>
                    {/* <Text style={styles.instructorText}>Instructor: {item.instructor}</Text> */}
                </View>
            )
        } else {
            return null;
        }

    }

        // Filter only upcoming classes
    const upcomingBookings = categorizedBookingData.filter(item => {
        const classDateTime = moment(`${item.date} ${item.time}`, 'MMMM DD, YYYY hh:mm A');
        const currentDateTime = moment();
        return classDateTime.isSameOrAfter(currentDateTime);
    });
    

    const renderItemPast = ({ item }) => {
        // Parse class date and time strings using Moment.js
    const classDateTime = moment(`${item.date} ${item.time}`, 'MMMM DD, YYYY hh:mm A');

    // Get the current date and time
    const currentDateTime = moment();

    // Compare with the current date and time
    if (classDateTime.isBefore(currentDateTime)) {
        return (
            <View style={styles.bookingCardPast} 
            // onPress={() => navigation.navigate("ClassDescription", {
            //     key: Math.random().toString(),
            //     _id: item._id,
            //     name: item.name,
            //     type: item.type,
            //     description: item.description,
            //     studioName: (item.resortName || item.studioName),
            //     time: item.time,
            //     date: item.date,
            //     address: item.address,
            //     address2: item.address2,
            //     cityState: item.cityState,
            //     zipcode: item.zipcode,
            //     instructor: item.instructor,
            //     price: item.price,
            //     currency: item.currency,
            //     typeClassId: item.typeClassId,
            //     providerId: item.providerId
            //     })}
            >
                <Text style={styles.classText}>{item.name}</Text>
                <Text style={styles.dateText}>{`${(item.resortName || item.studioName)}`}</Text>
                <Text style={styles.dateText}>{`${item.date} (${item.time})`}</Text>
                <Text style={styles.instructorText}>Instructor: {item.instructor}</Text>
            </View>
        )
    } else {
        return null;
    }
}
    // Filter only upcoming retreats
    const currentMemberships = categorizedBookingData.filter(item => {
        const classDateTime = moment(`${item.startDate}`, 'MMMM DD, YYYY');
        const currentDateTime = moment();
        return classDateTime.isSameOrAfter(currentDateTime);
    });


const renderCurrentMemberships = ({ item }) => {
    console.log('memberhsips', item)
    // Parse class date and time strings using Moment.js
    const classDateTime = moment(`${item.date} ${item.time}`, 'MMMM DD, YYYY hh:mm A');
    // Get the current date and time
    const currentDateTime = moment();
    
    // Compare with the current date and time
    if (classDateTime.isSameOrAfter(currentDateTime)) {
        return (
            <TouchableOpacity style={[styles.bookingCardUpcoming, activeTab === item.type && styles.selectedBooking]} onPress={() => {
                navigation.navigate('ClassDescription', { 
                    key: Math.random().toString(),
                    bookingIdFromBookings: item._id,
                    classId: item.classId,
                    name: item.name,
                    type: item.type,
                    description: item.description,
                    studioName: (item.resortName || item.studioName),
                    time: item.time,
                    date: item.date,
                    address: item.address,
                    address2: item.address2,
                    cityState: item.cityState,
                    zipcode: item.zipcode,
                    instructor: item.instructor,
                    price: item.price,
                    currency: item.currency,
                    typeClassId: item.typeClassId,
                    providerId: item.providerId,
                    profileImage: item.profileImage,
                    zoomUrl: item.zoomUrl,
                    bookingCodeFromBookings: item.bookingCode,
                    sourcePage: 'Bookings' // Pass the source page as a parameter
                })
            }}
            >
                <Text style={styles.classText}>{item.name}</Text>
                <Text style={styles.dateText}>{`${(item.resortName || item.studioName)}`}</Text>
                <Text style={styles.dateText}>{`${item.date} (${item.time})`}</Text>
                <Text style={styles.instructorText}>Instructor: {item.instructor}</Text>
            </TouchableOpacity>
        )
    } else {
        return null;
    }
}

 // Filter only upcoming retreats
 const pastMemberships = categorizedBookingData.filter(item => {
    const classDateTime = moment(`${item.startDate}`, 'MMMM DD, YYYY');
    const currentDateTime = moment();
    return classDateTime.isBefore(currentDateTime);
});


const renderPastMemberships = ({ item }) => {
console.log('past memberships', item)
// Parse class date and time strings using Moment.js
const classDateTime = moment(`${item.date}`, 'MMMM DD, YYYY');
// Get the current date and time
const currentDateTime = moment();

// Compare with the current date and time
if (classDateTime.isBefore(currentDateTime)) {
    return (
        <TouchableOpacity style={[styles.bookingCardUpcoming, activeTab === item.type && styles.selectedBooking]} onPress={() => {
            navigation.navigate('ClassDescription', { 
                key: Math.random().toString(),
                bookingIdFromBookings: item._id,
                classId: item.classId,
                name: item.name,
                type: item.type,
                description: item.description,
                studioName: (item.resortName || item.studioName),
                time: item.time,
                date: item.date,
                address: item.address,
                address2: item.address2,
                cityState: item.cityState,
                zipcode: item.zipcode,
                instructor: item.instructor,
                price: item.price,
                currency: item.currency,
                typeClassId: item.typeClassId,
                providerId: item.providerId,
                profileImage: item.profileImage,
                zoomUrl: item.zoomUrl,
                bookingCodeFromBookings: item.bookingCode,
                sourcePage: 'Bookings' // Pass the source page as a parameter
            })
        }}
        >
            <Text style={styles.classText}>{item.name}</Text>
            <Text style={styles.dateText}>{`${(item.resortName || item.studioName)}`}</Text>
            <Text style={styles.dateText}>{`${item.date} (${item.time})`}</Text>
            <Text style={styles.instructorText}>Instructor: {item.instructor}</Text>
        </TouchableOpacity>
    )
} else {
    return null;
}
}

    const renderBookings = () => {
        if (activeTab === 'Classes') {
            return upcomingBookings.map((item) => (
                <View key={item._id}>{renderItemUpcoming({ item })}</View>
            ));
        }
        if (activeTab === 'Memberships') {
            return currentMemberships.map((item) => (
                <View key={item._id}>{renderCurrentMemberships({ item })}</View>
            ));
        }
        if (activeTab === 'Retreats') {
            return upcomingRetreats.map((item) => (
                <View key={item._id}>{renderRetreatsUpcoming({ item })}</View>
            ));
        }
        return null;
    };

    const renderPastBookings = () => {
        if (activeTab === 'Classes') {
            return categorizedBookingData.map((item) => (
                <View key={item._id}>{renderItemPast({ item })}</View>
            ));
        }
        if (activeTab === 'Memberships') {
            return pastMemberships.map((item) => (
                <View key={item._id}>{renderPastMemberships({ item })}</View>
            ));
        }
        if (activeTab === 'Retreats') {
            return pastRetreats.map((item) => (
                <View key={item._id}>{renderRetreatsPast({ item })}</View>
            ));
        }
        return null;
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
        loading ? (
            <Modal
            transparent={true}
            animationType={'none'}
            visible={loading}
            onRequestClose={() => setLoading(false)}>
            <View style={styles.modalPageBackground}>
              <View style={styles.loaderContainer}>
                <View style={styles.titleTextContainer}>
                <MyText title={'Skimatt'} style={styles.ymLoaderTitle} h3 />
                  <View style={styles.webViewContainer}>
                    <ActivityIndicator style={styles.loaderIcon} size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>Currently loading your bookings...</Text>
                    <View style={styles.ymIconContainerWithinLoader}>
                      <Image style={styles.ymIconWithinLoader} source={require('../img/sm-icon red.png')} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        ) :
        <View style={styles.titleContainerNum}>
            <View style={styles.userHeader}>
                <View style={styles.userInfoContainer}>
                    <View styles={styles.userNameRatingContainer}>
                        <MyText title={`${userData.firstName} ${userData.lastName}`} style={styles.userInfo} p />
                    </View>
                    <Image style={styles.profileIcon} source={userData.profileImage ? { uri: userData.profileImage } : require ('../img/profile-user.png')} />
                </View>
                <View style={styles.bookingsButton}>
                    <Text style={styles.bookingsText}>Bookings</Text>
                </View>
            </View>
            <View style={styles.membershipsRetreatsContainer}>
                <TouchableOpacity style={[styles.mapItButton, activeTab === 'Classes' && styles.selectedButton]} onPress={() => handleTabChange('Classes')}>
                    <Text style={styles.mapItText}>Classes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.mapItButton, activeTab === 'Memberships' && styles.selectedButton]} onPress={() => handleTabChange('Memberships')} >
                    <Text style={styles.mapItText}>Memberships</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.mapItButton, activeTab === 'Retreats' && styles.selectedButton]} onPress={() => handleTabChange('Retreats')}>
                    <Text style={styles.mapItText}>Retreats</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                style={styles.bookingsScroll}
                contentContainerStyle={[
                    styles.bookingsScrollContent,
                    { paddingBottom: Math.max(insets.bottom, 16) + 16 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.bookingsSection}>
                    <Text style={styles.bookingsTitles}>Current</Text>
                    <View style={styles.cardsContainer}>
                        {renderBookings()}
                    </View>
                </View>
                <View style={[styles.bookingsSection, styles.pastBookingsSection]}>
                    <Text style={styles.bookingsTitles}>Past</Text>
                    <View style={styles.cardsContainer}>
                        {renderPastBookings()}
                    </View>
                </View>
                <View style={styles.navButtonsContainer}>
                    <BackButton navigation={navigation} screenName="Profile" />
                </View>
                <View style={styles.ymIconContainer}>
                    <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
                </View>
            </ScrollView>
        </View>
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
        fontWeight: 'bold',
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
        fontWeight: 'bold',
        borderRadius: 50,

    },

    ymIconContainer: {
        alignItems: 'center',
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
        marginTop: 24,
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginLeft: 4,
        width: '100%',
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
    },

    userHeader: {
        display: 'flex',
        alignItems: 'center',
        marginTop: 40
    },

    bookingsButton: {
        marginTop: 15,
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 60,
        borderRadius: 50,
        padding: 5,
        width: 250

    },
    bookingsText: {
        textAlign: 'center',
        alignItems: 'center',
        fontSize: 40,
        fontWeight: 'normal',
        fontFamily: 'americanTypewriterBold'
    },

    bookingsScroll: {
        flex: 1,
    },

    bookingsScrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
    },

    bookingsSection: {
        alignItems: 'center',
        width: '100%',
    },

    pastBookingsSection: {
        marginTop: 24,
    },

    cardsContainer: {
        width: '100%',
        maxWidth: 340,
        marginTop: 8,
    },

    bookingsTitles: {
        textAlign: 'center',
        fontSize: 25,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#c12818',
    },

    bookingCardUpcoming: {
        textAlign: 'center',
        backgroundColor: '#ffebd6',
        padding: 10,
        alignItems: 'center',
        borderRadius: 30,
        borderColor: '#c12818',
        borderWidth: 5,
        marginVertical: 10
    },

    bookingCardPast: {
        textAlign: 'center',
        backgroundColor: '#ffebd6',
        padding: 10,
        alignItems: 'center',
        borderRadius: 30,
        borderColor: 'gray',
        color: '#c12818',
        borderWidth: 5,
        marginVertical: 10
    },
    
    classText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#c12818',
    },

    dateText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#c12818',
    },

    instructorText: {
        fontSize: 14,
        textAlign: 'center',
        color: '#c12818',
    },

    mapItButton: {
        alignItems: 'center',
        color: 'black',
        backgroundColor: '#e8987c',
        borderRadius: 50,
        paddingHorizontal: 10
    },

    selectedButton: {
        alignItems: 'center',
        color: 'black',
        backgroundColor: '#e8987c',
        borderRadius: 50,
        paddingHorizontal: 10,
        borderWidth: 2
    },
  
    mapItText: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 18,
        paddingVertical: 6,
        alignItems: 'center',
    },
  
    membershipsRetreatsContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginTop: 20
    },

    
modalPageBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: '#ffebd6',
  
  },
  
  loaderContainer: {
    height: 150,
    width: 200,
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

  container: {
    alignContent: 'center'
  },

  userNameRatingContainer: {
    width: 200
  },
    
})