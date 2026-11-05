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
        backgroundColor: '#c12818',
        height: 50,
        fontWeight: 'normal',
        borderRadius: 50,
        width: 150,
        marginHorizontal: 20,
        borderWidth: 3,
        borderColor: '#ffebd6',
    },
    
    profileNavButtonText: {
        marginVertical: 5,
        color: '#ffebd6',
        textAlign: 'center',
        fontSize: 23,
        fontWeight: 'normal',
        fontFamily: 'americanTypewriterBold'
    },
});

export default NavButton;





