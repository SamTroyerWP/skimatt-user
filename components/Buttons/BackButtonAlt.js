import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import {faArrowCircleLeft, faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

const BackButtonAlt = ({ navigation, screenName, params }) => {
  const handlePress = () => { 
    if (params) {
      navigation.navigate(screenName, params); // Pass params if they exist
    } else {
      navigation.navigate(screenName); // No params
    }
  };

  return ( 

    <TouchableOpacity style={styles.fwdButtonContainer} onPress={handlePress}>
      <FontAwesomeIcon icon={faArrowCircleLeft} size={40} style={styles.fwdButton} />
      <View style={styles.fwdButtonBackground} />
    </TouchableOpacity>



  );
};

const styles = StyleSheet.create({
  fwdButtonContainer: {
    alignItems: 'center',
    marginVertical: 60
},

fwdButton: {
    position: 'absolute',
    color: '#c12818',
    borderColor: '#e8987c',
    
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

});

export default BackButtonAlt;
