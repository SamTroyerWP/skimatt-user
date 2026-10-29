import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EnterApp from "../views/00-EnterApp";
import EnterPhone from "../views/01-EnterPhone";
import EnterEmail from "../views/02-EnterEmail";
import EnterName from "../views/05-EnterName";
import EnterPassword from "../views/03-EnterPassword";
import TermsPage from "../views/04-TermsPage";
import SocialSignup from "../views/35-SocialSignup";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const AuthStack = () => {

    const navigation = useNavigation();

    useEffect(() => {
        checkStoredCredentials();
      }, []);

    const checkStoredCredentials = async () => {
    try {
        const email = await AsyncStorage.getItem('email');
        const password = await AsyncStorage.getItem('password');
        if (email && password) {
        navigation.navigate('EnterApp');
        }
    } catch (error) {
        console.error('Error checking stored credentials:', error);
    }
    };

    return (
        <Stack.Navigator initialRouteName='EnterPhone'>
            <Stack.Screen 
            name='EnterApp'
            component={EnterApp}
            options={{ headerShown: false }} // Hide header for this screen
            />
            <Stack.Screen 
            name='EnterPhone'
            component={EnterPhone}
            options={{ headerShown: false }} // Hide header for this screen
            /> 
            <Stack.Screen 
            name='EnterEmail'
            component={EnterEmail}
            options={{ headerShown: false }} // Hide header for this screen
            /> 
            <Stack.Screen 
            name='EnterName'
            component={EnterName}
            options={{ headerShown: false }} // Hide header for this screen
            />
            <Stack.Screen 
            name='EnterPassword'
            component={EnterPassword}
            options={{ headerShown: false }} // Hide header for this screen
            />
            <Stack.Screen
            name='TermsPage'
            component={TermsPage}
            options={{ headerShown: false }} // Hide header for this screen
            />
            <Stack.Screen
            name='SocialSignup'
            component={SocialSignup}
            options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
  }
  
  export default AuthStack;