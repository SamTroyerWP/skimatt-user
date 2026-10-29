import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import {faArrowCircleLeft} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

const BackButtonAltBlack = ({ navigation, screenName, params }) => {
  const handlePress = () => { 
    if (params) {
      navigation.navigate(screenName, params); // Pass params if they exist
    } else {
      navigation.navigate(screenName); // No params
    }
  };

  return ( 

    <TouchableOpacity style={styles.fwdButtonContainer} onPress={handlePress}>
      <View style={styles.fwdButtonBackground}>
        <FontAwesomeIcon icon={faArrowCircleLeft} size={40} style={styles.fwdButton} />
      </View>
    </TouchableOpacity>



  );
};

const styles = StyleSheet.create({
  fwdButtonContainer: {
    position: 'absolute',
    top: 60,
    left: 30,
    zIndex: 100,
},

fwdButton: {
    position: 'absolute',
    color: '#c12818',
    borderColor: '#e8987c',
    marginLeft: 5,
    marginTop: 5
},

fwdButtonBackground: {
    position: 'relative',
    width: 50,
    backgroundColor: '#e8987c',
    height: 50,
    borderRadius: 50,
    height: 50,
    zIndex: 1
},

});

export default BackButtonAltBlack;
