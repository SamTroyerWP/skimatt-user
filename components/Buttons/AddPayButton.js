import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const AddPayButton = ({ navigation, screenName }) => {
  const handlePress = () => {
    navigation.navigate(screenName );
  };

  return ( 
   <TouchableOpacity style={styles.addPaymentContainer} onPress={handlePress}>
     <View style={styles.addPaymentButton}>
        <Text style={styles.addPaymentButtonText}>+ Add Payment Method</Text>
    </View>
   </TouchableOpacity>

  );
};

const styles = StyleSheet.create({
    addPaymentContainer: {
        marginTop: 20
    },
    addPaymentButton: {
        color: '#7F5345',
        backgroundColor: '#fff0e0',
        height: 60,
        fontSize: 25,
        fontWeight: 'normal',
        borderColor: '#c12818',
        borderWidth: 3,
        borderRadius: 50,
        padding: 15

    },
    addPaymentButtonText: {
        textAlign: 'center',
        alignItems: 'center',
        color: '#c12818',
        fontSize: 20,
        fontWeight: 'normal',
        fontFamily: 'americanTypewriter'
    },
});

export default AddPayButton;
