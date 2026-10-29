import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Image, ActivityIndicator, ScrollView, TouchableWithoutFeedback, Keyboard, Linking, Alert } from 'react-native';
import { MyText } from '../components/MyText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faArrowLeft, faStar, faTimes, faBars } from '@fortawesome/free-solid-svg-icons';
import NextButton from '../components/Buttons/NextButton';
import BackButton from '../components/Buttons/BackButton';
import NavButton from '../components/Buttons/NavButton';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../views/config';
import { useFocusEffect } from '@react-navigation/native';
import NavigationContext from '../context/NavigationContext';

export default function Profile({ navigation }) {

  const { userLoggedIn, setUserLoggedIn } = useContext(NavigationContext);


  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    customerId: '',
    profileImage: ''
  });



  const [loaded] = useFonts({
    effortless: require('../assets/fonts/effortless.regular.ttf'),
    bebasNeue: require('../assets/fonts/BebasNeue-Regular.ttf'),
    americanTypewriter: require('../assets/fonts/american-typewriter.ttf'),
    americanTypewriterBold: require('../assets/fonts/american-typewriter-bold.ttf')
  });

  const [userTypes, setUserTypes] = useState([]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userResp = await fetch(`${config.apiUrl}/users/get`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      if (userResp.status !== 200) {
        alert('You have been signed out due to inactivity.  Please log back in.');
        setUserLoggedIn(false);
      }
      const userData = await userResp.json();
      setUserData(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        const userResp = await fetch(`${config.apiUrl}/users/get`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });
        if (userResp.status !== 200) {
          alert('An error occurred while processing your request');
          // Handle error or redirect to login screen
        }
        const userData = await userResp.json();
        setUserData(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        const userTypeClassResp = await fetch(`${config.apiUrl}/u-types/user`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });
        const userTypeClassData = await userTypeClassResp.json();
        setUserTypes(userTypeClassData);
        console.log('user type pass data', userTypeClassData)
        setLoading(false);
      };
      fetchData();
    }, [])
  );

  const [istopModalOpen, setIsTopModalOpen] = useState(false);

  const openTopModal = async () => {
    setIsTopModalOpen(true);
  }

  const closeTopModal = async () => {
    setIsTopModalOpen(false);
  }

  const openLogoutModal = async () => {
    setIsLogoutModalVisible(true);
    setIsTopModalOpen(false);
  }

  const closeLogoutModal = async () => {
    setIsLogoutModalVisible(false);
  }

  const renderRow = (data) => {
    return (
      <Text style={styles.currentlyShowingList} key={data.index}>{`\u2022 Nearby ${data.item.type} Passes`}</Text>
    );
  }

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${config.apiUrl}/users/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.ok) {

        await AsyncStorage.clear();
        setUserLoggedIn(false);
        navigation.navigate('Login');
        setIsLogoutModalVisible(false);
        alert('User logged out successfully!')
        
      } else {
        Alert.alert('Error', 'Failed to logout, try again');
      }
    } catch (error) {
      console.error('Error logging out:', error.message);
      Alert.alert('Error', 'Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const handleDeleteFlow = async () => {
    setIsDeleteModalVisible(true);
    setIsTopModalOpen(false);
  }


  const handleDeleteStripeAccount = async () => {
    console.log('delete account')
    console.log('customerid', userData.customerId)
    try {
      const response = await fetch(`${config.apiUrl}/payment/delete-customer-id-payment-methods/${userData.customerId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
      });      
      if (response.ok) {
        console.log('Stripe customer ID and payment methods deleted successfully');
        await handleDeleteAccount();
        console.log('account info deleted')
      }
    } catch (error) {
      console.error('there was an error deleting stripe customer id and payment methods', error.message)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${config.apiUrl}/users/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.ok) {

        await AsyncStorage.clear();
        setUserLoggedIn(false);
        navigation.navigate('Login');
        setIsDeleteModalVisible(false);
        alert('User account deleted successfully!')
        
      } else {
        alert('Error', 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error.message);
      alert('Error', 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };



  const handleNextPress = () => {
    navigation.navigate('Map');
  };

  if (!loaded) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <ActivityIndicator animating={loading} style={loading ? styles.loading : styles.hide} size="large" />
      <View style={styles.titleContainerNum}>
                <Image style={styles.skimattLogo} source={require('../img/skimatt logo.png')} />
                <MyText title={'Skier'} style={styles.teacherStudio} h3/>
        <View style={styles.userInfoContainer}>
          <View style={styles.userNameRatingContainer}>
            <MyText title={`${userData.firstName} ${userData.lastName}`} style={styles.userInfo} p />
            {/* 
                Profile Ratings need to be done!

            <TouchableOpacity style={styles.profileRatingButton} >
              <FontAwesomeIcon icon={faStar} size={10} />
              <Text style={styles.profileRatingText}>5.0</Text>
            </TouchableOpacity> */}
          </View>
            <View style={styles.profileIconMenuContainer}>
              <Image style={styles.profileIcon} source={userData.profileImage ? { uri: userData.profileImage } : require ('../img/profile-user-invert.png')} />
              <View style={styles.barsIconContainer}>
                <Text style={styles.barsIconText}>Menu</Text>
                <TouchableOpacity onPress={openTopModal}>
                  <FontAwesomeIcon style={styles.barsIcon} size={40} color='#e8987c' icon={faBars} />
                </TouchableOpacity>
              </View>
            </View>
          <Modal
            visible={istopModalOpen}
            animationType="fade"
            transparent={true}
            onRequestClose={closeTopModal}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.methodModalContainer}>
              <TouchableOpacity style={styles.instructorsModalCloseButton} onPress={closeTopModal}>
                                <FontAwesomeIcon style={styles.closeIcon} icon={faTimes} size={20} />
                            </TouchableOpacity>
                <View style={styles.methodModalContent}>
                  <TouchableOpacity onPress={() => {
                    Linking.openURL(
                      'https://www.yogamatt.org/terms-and-conditions'
                    );
                  }}>
                    <Text style={styles.topModalText}>Terms & Conditions</Text>
                  </TouchableOpacity>
                  <View style={styles.lineSeparator} />
                  <TouchableOpacity onPress={() => {
                    Linking.openURL(
                      'https://www.yogamatt.org/privacy-policy'
                    );
                  }}>
                    <Text style={styles.topModalText}>Privacy Policy</Text> 
                  </TouchableOpacity>
                  <View style={styles.lineSeparator} />
                  <TouchableOpacity onPress={handleDeleteFlow}>
                    <Text style={styles.topModalText}>Delete Account</Text> 
                  </TouchableOpacity>
                  
                  <View style={styles.lineSeparator} />
                  <TouchableOpacity onPress={openLogoutModal}>
                    <Text style={styles.topModalText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
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
            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.modalMessage}>Are you sure you want to delete your account? This action cannot be undone.</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleDeleteStripeAccount}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
        </View>
      </Modal>
          <Modal
                visible={isLogoutModalVisible}
                transparent={true}
                animationType="slide"
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 300, padding: 20, backgroundColor: '#c12818', borderColor: '#c12818', borderWidth: 5, borderRadius: 10 }}>
                        <Text style={styles.logoutText}>Are you sure you want to logout?</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                            <TouchableOpacity style={styles.logoutModalButtons} onPress={closeLogoutModal}>
                                <Text style={styles.logoutModalButtonsText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.logoutModalButtons} onPress={handleLogout}>
                                <Text style={styles.logoutModalButtonsText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
        
        <View style={styles.profileNavContainer}>
          <NavButton label="Wallet" navigation={navigation} screenName="Wallet" />
          <NavButton label="Bookings" navigation={navigation} screenName="Bookings" />
        </View>
        <View style={styles.currentlyShowingContainer}>
          <MyText title={'Currently Showing:'} style={styles.currentlyShowing} p />
          {userTypes.map((data, index) => (
            <Text style={styles.currentlyShowingList} key={index}>{`\u2022 Nearby ${data.type} Passes`}</Text>
          ))}
        </View>
        <View style={styles.navButtonsContainer}>
          <BackButton navigation={navigation} screenName="ProfileSettings" />
          <NextButton navigation={navigation} handlePress={handleNextPress} />
        </View>
        <View style={styles.ymIconContainer}>
          <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
        </View>
      </View>
    </ScrollView>
  );
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
  container: {
    flex: 1,
    backgroundColor: '#ffebd6',
  },
  titleContainerNum: {
    margin: 0,
    alignItems: 'center',
    flex: 1,
    padding: 40,
    // marginLeft: -30,
    marginTop: -30,
    backgroundColor: '#ffebd6',
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

  addPaymentTitle: {
    fontFamily: 'bebasNeue',
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
    textAlign: 'left',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 20
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

  navButtonsContainer: {
    marginTop: 40,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    width: '100%',

  },
  profileIcon: {
    height: 70,
    width: 70,
    margin: 10,
    borderRadius: 50
  },

  profileIconMenuContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },

  barsIconContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  barsIconText: {
    fontFamily: 'americanTypewriterBold',
    fontSize: 18,
    color: '#c12818'
  },

  userNameRatingContainer: {
    width: 200
  },

  userInfoContainer: {
    marginLeft: 20,
    marginRight: -20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
  },

  userInfo: {
    fontFamily: 'americanTypewriterBold',
    fontSize: 30,
    color: '#c12818'
  },

  userInfoContact: {
    fontFamily: 'americanTypewriter',
    fontSize: 20
  },


  currentlyShowingContainer: {
    display: 'flex',
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#c12818',
    width: '100%',
    height: 250
  },

  currentlyShowing: {
    fontFamily: 'americanTypewriterBold',
    fontSize: 28,
    margin: 15,
    color: '#c12818'
  },

  profileNavContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 20,
    // width: '100%'

  },
  profileRatingButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8987c',
    height: 30,
    borderRadius: 50,
    width: 50,
    paddingHorizontal: 5,
    justifyContent: 'space-around'
  },

  profileRatingText: {
    marginVertical: 5,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'normal',
    fontFamily: 'americanTypewriterBold',
  },

  currentlyShowingList: {
    fontFamily: 'americanTypewriter',
    fontSize: 15,
    margin: 10,
    color: '#c12818'
  },

  methodModalContainer: {
    flex: 1,
    top: -230,
    left: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)', // Semi-transparent black
  },

  methodModalContent: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#c12818',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
  },

  lineSeparator: {
    backgroundColor: '#fff',
    height: 2,
    width: 100,
    marginVertical: 10,
},

  topModalText: {
    color: '#000',
    fontFamily: 'americanTypewriterBold'
  },

  instructorsModalCloseButton: {
    position: 'absolute',
    height: 1150,
    top: -200,
    padding: 5,
    width: 420,
    opacity: 0,
    zIndex: 0
  },

  logoutText: {
    textAlign: 'center',
    color: '#c12818',
    fontFamily: 'americanTypewriterBold'
  },

  logoutModalButtons: {
    color: '#7F5345',
    backgroundColor: '#e8987c',
    height: 35,
    fontWeight: 'normal',
    borderRadius: 50,
    width: 100,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
    logoutModalButtonsText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'normal',
    fontFamily: 'effortless'
  },

  
  deleteButtonText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    borderColor: '#e8987c',
    borderWidth: 3,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 25
  },

  deleteModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Semi-transparent black
  },

  deleteModal: {
    top: 260,
    left: 55,
    width: 300,
    backgroundColor: '#c12818',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#c12818',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#c12818',
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

});
