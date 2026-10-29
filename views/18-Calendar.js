import React, {useEffect, useState} from 'react';
import {
  Image, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowCircleDown, faArrowCircleRight, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { useFonts } from 'expo-font';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { format } from 'date-fns';
import config from './config';
import BackButtonAlt from '../components/Buttons/BackButtonAlt';
import moment from 'moment';

export default function SetCalendar({ route, navigation }) {

    const providerId = route.params.providerId;

    const [classData, setClassData] = useState([]);
    const [retreatsData, setRetreatsData] = useState([]);
    const [providerData, setProviderData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));    

    const [minDate, setMinDate] = useState(new Date()); // New state for minimum selectable date
    const [markedDates, setMarkedDates] = useState({});
    const [retreatDates, setRetreatDates] = useState({});
    const [mergedMarkedDates, setMergedMarkedDates] = useState({});
    
    useEffect(() => {
      const mergedDates = { ...markedDates };
    
      Object.keys(retreatDates).forEach((date) => {
        if (mergedDates[date]) {
          // Merge retreats dot on top of existing class date styling
          mergedDates[date] = {
            ...mergedDates[date],
            dotColor: 'red',   // Keeps the red dot
            marked: true,      // Ensures the red dot appears
          };
        } else {
          // Add retreat-only dates
          mergedDates[date] = {
            dotColor: 'red',
            color: 'transparent', // No circle, just dot
            marked: true,
          };
        }
      });
    
      setMergedMarkedDates(mergedDates);
    }, [markedDates, retreatDates]);

    const getClasses = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/classes?providerId=${providerId}`);
        const data = await res.json();
        setClassData(data);

        
        if (data) {
          const markedDatesObject = {};
          data.forEach((classItem) => {
            const classDate = moment(classItem.date, 'MMMM DD, YYYY').format('YYYY-MM-DD');
            // Check if the class date is not before today
            if (new Date(classDate) >= new Date()) {
              markedDatesObject[classDate] = {
                color: 'blue',
                dotColor: 'blue',
                selected: true,
                textColor: 'white',
              };
            }
          });

          setMarkedDates(markedDatesObject);
          console.log(markedDatesObject)
        }
      } catch (error) {
        console.log(error);
      }
    }

    const getRetreats = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/retreats?providerId=${providerId}`);
        const data = await res.json();
        console.log(data)
        setRetreatsData(data);
    
        if (data) {
          const markedDatesObject = {};
          data.forEach((retreatItem) => {
            const startDate = moment(retreatItem.startDate, 'YYYY-MM-DD');
            const endDate = moment(retreatItem.endDate, 'YYYY-MM-DD');
            console.log('start date', retreatItem.startDate, 'end date', retreatItem.endDate)
            // Mark each day between start and end dates
            for (let date = moment(startDate); date.isSameOrBefore(endDate); date.add(1, 'day')) {
              const formattedDate = date.format('YYYY-MM-DD');
              markedDatesObject[formattedDate] = {
                dotColor: 'red',
                color: 'red',
                marked: true,
              };
            }
          });
          console.log('retreats', markedDatesObject)
          setRetreatDates(markedDatesObject);
        }
      } catch (error) {
        console.log(error);
      }
    }

 
  const getProvider = async () => {
    const providerResp = await fetch(`${config.apiUrl}/providers/get-provider/${providerId}`);
    const data = await providerResp.json();
    setProviderData(data);
    console.log('data', data)
    setLoading(false);
}
    
    const currentDate = new Date();

    // const selectDate = async () => {
    //   try {
    //     navigation.navigate("MoreClasses",
    //      { selectedDate: selected, providerId: providerId }
    //      )
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }
    

    const months = [
      'January', 'February', 'March', 'April',
      'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
      console.log('provider id', providerId)
      getClasses();
      getRetreats();
      getProvider();
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


    const todaysDate = `${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      
    const onDayPress = day => {
        const selectedDate = new Date(day.dateString);
        const adjustedDate = new Date(
          selectedDate.getUTCFullYear(),
          selectedDate.getUTCMonth(),
          selectedDate.getUTCDate()
        );
        setSelected(format(adjustedDate, 'MMMM dd, yyyy'));
        console.log(format(adjustedDate, 'MMMM dd, yyyy'))
        try {
          navigation.navigate("MoreClasses", { 
            selectedDate: format(adjustedDate, 'MMMM dd, yyyy'), 
            providerId: providerId }
           )
        } catch (error) {
          console.log(error);
        }
    };
  

  
    // const renderDay = (day) => {
    //   const date = day.dateString;
    //   if (markedDates[date]) {
    //     return (
    //       <View>
    //         <Text>{day.day} - has icon</Text>
    //         <View style={styles.ymIconContainer}>
    //           <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
    //         </View>
    //       </View>
    //     );
    //   } else {
    //     return (
    //       <View>
    //         <Text>{day.day}</Text>
    //       </View>
    //     );
    //   }
    // };

    return (
        <View style={styles.calendarPageContainer}>
          <ScrollView
            contentContainerStyle={styles.calendarScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
          <MyText title={'Skier'} style={styles.teacherStudio} h3/>
          <MyText title={(providerData.resortName || providerData.studioName)} style={styles.classesStudio} p />
          <MyText style={styles.todaysDateTitle} title={`Today's Date:`} />
          <MyText style={styles.todaysDate} title={`${todaysDate}`} />
          <View style={styles.membershipsRetreatsContainer}>
            <TouchableOpacity style={styles.mapItButton} onPress={() => navigation.navigate('Memberships', {providerId: providerId})}>
              <Text style={styles.mapItText}>Memberships</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapItButton} onPress={() => navigation.navigate('Retreats', {providerId: providerId})}>
              <Text style={styles.mapItText}>Retreats</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calendarWrapper}>
            <Calendar
              style={styles.calendarContainer}
              theme={{
                calendarBackground: "#c12818",
                textSectionTitleColor: "#c12818",
                monthTextColor: '#c12818',
                selectedDayBackgroundColor: "#00bbf2",
                textMonthFontSize: 24,
                textDisabledColor: '#d9d9d9',
                textMonthFontWeight: 'bold',
                textMonthFontFamily: 'americanTypewriterBold',
                arrowColor: '#c12818',
                todayTextColor: 'red',
                dayTextColor: '#c12818',
              }}
              onDayPress={onDayPress}
              markedDates={mergedMarkedDates}
              minDate={minDate.toString()}
            />
          </View>
          <View style={styles.classesForContainer}>
            <Text style={styles.classesHeader}>
              Use the calendar above to search passes for a specific day
            </Text>
          </View>
          <View style={styles.navButtonsContainer}>
            <BackButtonAlt navigation={navigation} screenName='Map' />
          </View>
          </ScrollView>
        </View>
    )}
        
const styles = StyleSheet.create({
  skimattLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 8,
  },
   
    calendarPageContainer: {
        margin: 0,
        flex: 1,
        backgroundColor: '#ffebd6',
    },

    calendarScrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },

            h1: {
        fontSize: 55,
        textAlign: 'center',
        color: '#c12818',
        marginBottom: 10,
        marginTop: 40

    },

    teacherStudio: {
      color: '#c12818',
      textAlign: 'center',
      fontFamily: 'effortless',
      fontSize: 28
    },

    calendarWrapper: {
        width: '100%',
        marginTop: 4,
        marginBottom: 4,
        overflow: 'hidden',
    },

    calendarContainer: {
        width: '100%',
    },

    classesStudio: {
      marginTop: 24,
      fontFamily: 'americanTypewriterBold',
      fontSize: 30,
      textAlign: 'center',
      color: '#c12818'
  },
    todaysDateTitle: {
      textAlign: 'center',
      marginVertical: 20,
      marginBottom: 10,
      fontSize: 24,
      color: '#c12818'
  },
    todaysDate: {
        textAlign: 'center',
        marginBottom: 16,
        fontSize: 24,
        color: 'red'
    },

    selectedDate: {
      textAlign: 'center',
      fontSize: 24,
      marginVertical: 5
  },
  
  selectedDateTitle: {
    textAlign: 'center',
    fontSize: 27,
},
  
    fwdButtonContainer: {
        alignItems: 'center',
        marginVertical: 60
    },

    fwdButton: {
        position: 'absolute',
        color: '#fff',
        borderColor: '#e8987c',
        marginLeft: 5,
        marginTop: 5
    },

    fwdButtonBackground: {
        position: 'relative',
        width: 50,
        backgroundColor: '#e8987c',
        height: 60,
        borderRadius: 50,
        height: 50,
        zIndex: -1
    },

    setCalendarContainer: {
        marginHorizontal: 18,
        marginVertical: -10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },

    setCalendarText: {
        fontFamily: 'americanTypewriter',
        fontSize: 30
    },
    navButtonsContainer: {
      marginTop: -50,
      marginBottom: 8,
      display: 'flex',
      marginHorizontal: 20,
      flexDirection: 'row',
    },

    classesForContainer: {
      alignItems: 'center',
      marginTop: 10,
      paddingHorizontal: 20,
    },
    
    classesHeader: {
      fontSize: 20,
      lineHeight: 28,
      textAlign: 'center',
      maxWidth: 320,
      color: '#c12818',
      fontFamily: 'effortless',
    },

    selectedDateText: {
      fontSize: 20,
      marginTop: 20,
      textAlign: 'center'
    },

    ymIconContainer: {
      alignItems: 'center',
      marginBottom: 10, 
    },
  
    ymIcon: {
      width: 20,
      height: 20,
    },

    mapItButton: {
      alignItems: 'center',
      color: 'black',
      backgroundColor: '#e8987c',
      borderRadius: 50,
      width: 160,
      padding: 5
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
    justifyContent: 'space-between',
    marginHorizontal: 30
  }
 
})