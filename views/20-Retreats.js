import React, {useRef, useEffect, useState} from 'react';
import {
  Image, 
    StyleSheet, 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity,
    Dimensions, 
} from 'react-native';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import config from '../views/config';
import BackButtonAlt from '../components/Buttons/BackButtonAlt';
import moment from 'moment'

export default function Retreats({ route, navigation }) {

    const { providerId, selectedDate } = route.params;

    const [retreatsData, setRetreatsData] = useState([]);
    const [providerData, setProviderData] = useState([]);
    const [loading, setLoading] = useState(true);
        
    const formatDate = (dateString) => {
        const date = new Date(dateString);

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }

        return date.toLocaleDateString(undefined, options);
    }

    const inputDate = selectedDate ? new Date(selectedDate) : new Date();
    const formattedDate = selectedDate || (`${formatDate(inputDate)} (today)`);

    const getRetreats = async () => {
        const res = await fetch(`${config.apiUrl}/retreats?providerId=${providerId}`);
        const data = await res.json();
        setRetreatsData(data);
        setLoading(false);
        console.log(retreatsData)
    }

    const getProvider = async () => {
        const providerResp = await fetch(`${config.apiUrl}/providers/get-provider/${providerId}`);
        const data = await providerResp.json();
        setProviderData(data);
        console.log((data.resortName || data.studioName))
        setLoading(false);
    }

    useEffect(() => {
        getRetreats();
        getProvider();
    }, []);

 
  
    const displayResults = () => {

        const today = moment(); // Get today's date

        const filteredRetreats = retreatsData.filter(item => {
            return moment(item.startDate).isSameOrAfter(today, 'day'); // Filter retreats starting today or later
        });

        if (filteredRetreats.length > 0) {
            return filteredRetreats.map((item) => (
                <View key={item._id} style={styles.resultContainer}>
                    <View style={styles.bookingCard}>
                        <Text style={styles.classText}>{item.name}</Text>
                        
                        {item.address2 ? 
                        <Text style={styles.locationText}>
                            {item.address} ({item.address2})
                        </Text>
                        : <Text style={styles.locationText}>
                            {item.address}
                        </Text> }
                        <Text style={styles.locationText}>{item.cityState} {item.zipcode}</Text>

                        <TouchableOpacity style={styles.bookItButton} onPress={() => navigation.navigate('Map')}>
                            <Text style={styles.learnMoreText}>Map It!</Text>
                        </TouchableOpacity>
                        <Text style={styles.dateText}>{item.price} {item.currency}</Text>                    
                        <Text style={styles.dateText}>{moment(item.startDate).format('MMMM Do, YYYY')} - {moment(item.endDate).format('MMMM Do, YYYY')}</Text>                    
            
                        <TouchableOpacity style={styles.bookItButton} onPress={() => {
                            navigation.navigate('ClassDescription', { 
                                key: Math.random().toString(),
                                classId: item._id,
                                name: item.name,
                                type: item.type,
                                description: item.description,
                                studioName: (item.resortName || item.studioName),
                                time: item.time,
                                date: item.date,
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
                                maxParticipants: item.maxParticipants,
                                profileImage: item.profileImage,
                                sourcePage: 'Retreats' // Pass the source page as a parameter

                            })
                        }}>
                            <Text style={styles.bookItText}>Buy Ticket!</Text>
                        </TouchableOpacity>
                        {/* <TouchableOpacity style={styles.learnMoreButton} onPress={() => navigation.navigate('ClassDescription', { selectedClass: item})}>
                            <Text style={styles.learnMoreText}>Learn More</Text>
                        </TouchableOpacity> */}
                    </View>
                </View>
                ));
            } else {
                return <View style={styles.noClassesContainer}>
                    <Text style={styles.noClassesText}>No retreats currently available.</Text>
                </View>
            }
          }
    
        

    const handleCalendarPress = () => {
        navigation.navigate('Calendar', {providerId: providerId})
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
        <View style={styles.titleContainerNum}>
            <View style={styles.userHeader}>
                <View style={styles.backButtonContainer}>
                    <BackButtonAlt navigation={navigation} screenName='Map' />
                </View>
                <View style={styles.userInfoContainer}>
                    <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
                    <MyText title={'Skier'} style={styles.teacherStudio} h3/>
                    <MyText title={(providerData.resortName || providerData.studioName)} style={styles.classesStudio} p />
                    <MyText title={`Selected Date: ${formattedDate}`} style={styles.classesDate} p />
                    <TouchableOpacity onPress={handleCalendarPress}>
                        <FontAwesomeIcon icon={faCalendarAlt} size={40} color='#e8987c' style={styles.calendarIcon} />
                    </TouchableOpacity>
                </View>    
            </View>
            <View style={styles.bookingsContainer}>
            <ScrollView style={styles.scrollViewContainer}>
                {loading ? (
                <Text>Loading data...</Text>
                ) : (
                <View style={styles.titleContainerNum}>
                    {displayResults()}
                </View>
                )}
            </ScrollView>
 
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
        marginTop: 100,
        display: 'flex',
        justifyContent: 'space-around',
        flexDirection: 'row',
    },

 
    buttonContents: {
        display: 'flex',
        marginHorizontal: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    backButton: {
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 50,
        borderRadius: 50,
        borderColor: 'black',
        width: 50,
        alignItems: 'center',
        padding: 20
    },
   h1: {
        fontSize: 55,
        textAlign: 'center',
        color: '#c12818',
        marginBottom: 10,
        marginTop: 20
    },

    teacherStudio: {
      color: '#c12818',
      textAlign: 'center',
      fontFamily: 'effortless',
      fontSize: 28
    },

    userInfoContainer: {
        display: 'flex',
        alignItems: 'center',
        marginTop: -60
    },

    classesStudio: {
        fontFamily: 'americanTypewriterBold',
        fontSize: 30,
        marginTop: 30,
        color: '#c12818'
    },

    classesDate: {
        fontSize: 20,
        color: '#c12818',
    },

    userHeader: {
        paddingTop: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#c12818',
    },

    bookingsButton: {
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

    bookingsContainer: {
        display: 'flex',
        marginVertical: 2,
        alignItems: 'center',
    },

    cardsContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        marginVertical: 30
    },

    bookingsTitles: {
        textAlign: 'center',
        fontSize: 25,
        fontWeight: 500
    },

    bookingCard: {
        textAlign: 'center',
        backgroundColor: '#ffebd6',
        padding: 10,
        borderRadius: 30,
        borderColor: '#c12818',
        borderWidth: 5,
        marginVertical: 10,
    },
    
    classText: {
        fontSize: 20,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#c12818'
    },

    locationText: {
        fontSize: 17,
        textAlign: 'center',
        color: '#c12818'
    },

    dateText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#c12818'
    },

    instructorText: {
        fontSize: 14,
        textAlign: 'center',
        color: '#c12818'
    },

    bookItButton: {
        alignItems: 'center',
        backgroundColor: '#e8987c',
        borderRadius: 50,
        marginVertical: 5,
        marginHorizontal: 50,
        paddingVertical: 5,
    },

    bookItText: {
        fontFamily: 'americanTypewriterBold',
        paddingHorizontal: 10,
        fontSize: 20
    },

    learnMoreButton: {
        alignItems: 'center',
        backgroundColor: '#e8987c',
        borderRadius: 50,
        marginVertical: 5,
        marginHorizontal: 60,
        paddingVertical: 5,
    },

    learnMoreText: {
        fontFamily: 'americanTypewriterBold',
        paddingHorizontal: 10
    },

    calendarIcon: {
        margin: 10
    },

    prevClassesButton: {
        position: 'absolute',
        width: 70,
        height: 70,
        bottom: 10,
        left: -80
    },

    prevClassesButtonDisabled: {
        position: 'absolute',
        width: 70,
        height: 70,
        bottom: 10,
        left: -80
    },
    
    nextClassesButton: {
        position: 'absolute',
        width: 70,
        height: 70,
        bottom: 10,
        right: -80
    },

    nextClassesButtonDisabled: {
        position: 'absolute',
        width: 70,
        height: 70,
        bottom: 10,
        right: -80
    },

    backButtonContainer: {
        margin: -30,
        right: 160
    },
    scrollViewContainer: {
        flex: 0,
        backgroundColor: '#ffebd6',
        height: 580
      },
      
      resultContainer: {
        marginVertical: 10,
      },

      noClassesContainer: {
        margin: 70,
        marginTop: 140,
        alignItems: 'center'
      },
      noClassesText: {
        fontSize: 30,
        fontFamily: 'effortless',
        textAlign: 'center',
        color: '#c12818'
      }

    
})