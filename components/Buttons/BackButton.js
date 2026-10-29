import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

const BackButton = ({ navigation, screenName, params }) => {
  const handlePress = () => { 
    if (params) {
      navigation.navigate(screenName, params); // Pass params if they exist
    } else {
      navigation.navigate(screenName); // No params
    }
  };

  return ( 
   <TouchableOpacity style={styles.backButton} onPress={handlePress}>
     <View style={styles.buttonContents}>
      <FontAwesomeIcon icon={faArrowLeft} size={22} />
    </View>
   </TouchableOpacity>

  );
};

const styles = StyleSheet.create({
    backButton: {
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 50,
        fontWeight: 600,
        borderRadius: 50,
        width: 50,
        alignItems: 'center',
        padding: 15
    },

    buttonContents: {
        display: 'flex',
        marginHorizontal: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }

});

export default BackButton;
