import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function Sandbox() {
    <View style={styles.container}>
        <Text style={styles.boxOne}>One</Text>
        <Text style={styles.boxTwo}>Two</Text>
        <Text style={styles.boxThree}>Three</Text>
        <Text style={styles.boxFour}>Four</Text>

    </View>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
        backgroundColor: '#ddd'
    },
    boxOne: {

    },
    boxTwo: {
        
    },
    boxThree: {
        
    },
    boxFour: {
        
    }
})