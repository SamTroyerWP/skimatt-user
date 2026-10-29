import React, { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthStack from './stack/AuthStack';
import MainStack from './stack/MainStack';
import NavigationContext from './context/NavigationContext';
import { APP_MODE, USER_ROLE } from './utils/appSession';

const STRIPE_KEY = 'pk_live_RjUSAJZ8yGfI0jC99f43Rcuh00eMMFOSbH';
const APPLE_MERCHANT_ID = 'merchant.com.publicservicetelevision.yogamatt';

export default function App() {
  const linking = {
    prefixes: ['skimatt-user://'],
    config: {
      screens: {
        MainStack: {
          path: 'main',
          screens: {
            ClassDescription: {
              path: 'ClassDescription/:classId',
            },
            MembershipDescription: {
              path: 'MembershipDescription/:membershipId',
            },
          },
        },
      },
    },
  };

  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        setUserLoggedIn(Boolean(userToken));
      } catch (error) {
        console.error('Error getting token:', error);
        setUserLoggedIn(false);
      } finally {
        setReady(true);
      }
    };
    checkLoginStatus();
  }, []);

  const setUserRole = useCallback(() => {}, []);
  const setAppMode = useCallback(() => {}, []);

  const navigationContextValue = {
    userLoggedIn,
    setUserLoggedIn,
    userRole: USER_ROLE.USER,
    setUserRole,
    appMode: APP_MODE.CONSUMER,
    setAppMode,
  };

  if (!ready) {
    return <View style={styles.boot} />;
  }

  return (
    <StripeProvider publishableKey={STRIPE_KEY} merchantIdentifier={APPLE_MERCHANT_ID}>
      <NavigationContainer linking={linking}>
        <NavigationContext.Provider value={navigationContextValue}>
          {userLoggedIn ? <MainStack key="main" /> : <AuthStack key="auth" />}
        </NavigationContext.Provider>
      </NavigationContainer>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: '#c12818',
  },
});
