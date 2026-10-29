import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Modal } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigationState } from '@react-navigation/native';
import ProfileSettings from '../views/08-ProfileSettings';
import CancellationPolicy from '../views/16-CancellationPolicy';
import Profile from '../views/09-Profile';
import Bookings from '../views/11-Bookings';
import Wallet from '../views/10-Wallet';
import MoreClasses from '../views/13-MoreClasses';
import ClassDescription from '../views/12-ClassDescription';
import Map from '../views/15-Map';
import AddPaymentMethod from '../views/06-AddPaymentMethod';
import CardDetails from '../views/07-CardDetails';
import CodePage from '../views/17-CodePage';
import ClassDescriptionFromBookings from '../views/12-ClassDescription';
import SetCalendar from '../views/18-Calendar';
import Memberships from '../views/19-Memberships';
import Retreats from '../views/20-Retreats';
import GoogleSetup from '../views/07-GoogleSetup';
import AppleSetup from '../views/07-AppleSetup';
import MembershipDescription from '../views/21-MembershipDescription'
import ChatOverlay from '../components/ChatOverlay';
import { ChatProvider, useChat } from '../context/ChatContext';


const Stack = createNativeStackNavigator();

function MainStackContent () {

  const {showChat, setShowChat, hasBooking} = useChat();
  const navigationState = useNavigationState((state) => state);
  const currentRouteName = navigationState?.routes[navigationState.index]?.name;
  const shouldShowChat = ['ClassDescription', 'Map', 'MoreClasses', 'Calendar', 'Memberships', 'Retreats'].includes(currentRouteName);


  // const handleDeepLink = (event) => {
  //   const { url } = event;
  //   const route = url.replace(/.*?:\/\//g, '');
  //   const [prefix, path, id] = route.split('/');

  //   if (prefix === 'main' && path === 'ClassDescription') {
  //     // Navigate to ClassDescription with the id
  //     Alert.alert('Deep Link', `Navigating to ClassDescription with ID: ${id}`);
  //     navigation.navigate('ClassDescription');
  //   }
  // };


  // useEffect(() => {
  //   const getUrl = async () => {
  //     const initialUrl = await Linking.getInitialURL();
  //     if (initialUrl) {
  //       handleDeepLink({ url: initialUrl });
  //     }
  //   };

  //   getUrl();
  //   Linking.addEventListener('url', handleDeepLink);

  //   return () => {
  //     Linking.removeEventListener('url', handleDeepLink);
  //   };
  // }, []);

  return (
    <>
    <Stack.Navigator>
      <Stack.Screen
        name='Map'
        component={Map}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='CancellationPolicy'
        component={CancellationPolicy}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='ProfileSettings'
        component={ProfileSettings}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen 
        name='Profile'
        component={Profile}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='Bookings'
        component={Bookings}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='Wallet'
        component={Wallet}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='MoreClasses'
        component={MoreClasses}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='ClassDescriptionFromBookings'
        component={ClassDescriptionFromBookings}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='ClassDescription'
        component={ClassDescription}
        options={{ headerShown: false }} // Hide header for this screen
      />
      
      <Stack.Screen
        name='AddPaymentMethod'
        component={AddPaymentMethod}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='CardDetails'
        component={CardDetails}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='AppleSetup'
        component={AppleSetup}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='GoogleSetup'
        component={GoogleSetup}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='CodePage'
        component={CodePage}
        options={{ headerShown: false }} // Hide header for this screen
      /> 
      <Stack.Screen
        name='Calendar'
        component={SetCalendar}
        options={{ headerShown: false }} // Hide header for this screen
      />
      <Stack.Screen
        name='Memberships'
        component={Memberships}
        options={{ headerShown: false }} // Hide header for this screen
      /> 
      <Stack.Screen
        name='Retreats'
        component={Retreats}
        options={{ headerShown: false }} // Hide header for this screen
      /> 
      <Stack.Screen
        name='MembershipDescription'
        component={MembershipDescription}
        options={{ headerShown: false }} // Hide header for this screen
      /> 
      
    </Stack.Navigator>
    {shouldShowChat && !showChat && hasBooking && currentRouteName !== 'Map' && (
      <TouchableOpacity style={styles.floatingButton} onPress={() => setShowChat(true)}>
        <Text style={styles.buttonText}>💬</Text>
      </TouchableOpacity>
    )}
 
    <Modal
      visible={Boolean(shouldShowChat && showChat)}
      transparent
      animationType="slide"
      onRequestClose={() => setShowChat(false)}
    >
      <ChatOverlay onClose={() => setShowChat(false)} />
    </Modal>
      </>
   );
 }
 
 export default function MainStack() {
   return (
     <ChatProvider>
       <MainStackContent />
     </ChatProvider>
   );
 }

 const styles = StyleSheet.create({
   floatingButton: {
     position: 'absolute',
     bottom: 50,
     right: 20,
     backgroundColor: '#c12818',
     borderRadius: 30,
     width: 60,
     height: 60,
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 999,
     elevation: 5,
   },
   buttonText: {
     color: 'white',
     fontSize: 24,
   },
 });

