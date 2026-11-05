import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import {faArrowRight} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

const NextButton = ({ navigation, handlePress }) => {
  return ( 
   <TouchableOpacity style={styles.nextButton} onPress={() => handlePress()}>
     <View style={styles.buttonContents}>
        <Text style={styles.buttonText}>next</Text>
          <FontAwesomeIcon icon={faArrowRight} size={22} color='#ffebd6' style={styles.arrowIcons} />
    </View>
   </TouchableOpacity>

  );
};

const styles = StyleSheet.create({
    nextButton: {
        color: '#ffebd6',
        backgroundColor: '#c12818',
        height: 50,
        fontWeight: 'normal',
        borderRadius: 50,
        width: 150,
        paddingHorizontal: 10,
        justifyContent: 'space-between',
        borderWidth: 3,
        borderColor: '#ffebd6',
    },
    buttonContents: {
        display: 'flex',
        marginHorizontal: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    buttonText: {
        margin: 0,
        textAlign: 'center',
        padding: 10,
        fontSize: 25,
        color: '#ffebd6',
        fontWeight: 'normal',
        fontFamily: 'effortless'
    },

});

export default NextButton;





