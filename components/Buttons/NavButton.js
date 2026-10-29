import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const NavButton = ({ label, navigation, screenName }) => {
  const handlePress = () => {
    navigation.navigate(screenName);
  };

  return ( 
   <TouchableOpacity style={styles.profileNavButton} onPress={handlePress}>
           <Text style={styles.profileNavButtonText}>{label}</Text>
   </TouchableOpacity>

  );
};

const styles = StyleSheet.create({
    profileNavButton: {
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 50,
        fontWeight: 'normal',
        borderRadius: 50,
        width: 150,
        marginHorizontal: 20,
    },
    
    profileNavButtonText: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 23,
        fontWeight: 'normal',
        fontFamily: 'americanTypewriterBold'
    },
});

export default NavButton;





