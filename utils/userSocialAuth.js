import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../views/config';
import { USER_ROLE, persistAuthRole, APP_MODE } from './appSession';
import { normalizePhoneNumber } from './phoneNumber';

export const completeUserSocialAuth = async ({
  provider,
  providerId,
  email,
  firstName,
  lastName,
  phoneNumber,
  navigation,
  setUserLoggedIn,
  setUserRole,
  setAppMode,
  // When true, caller handles the "needs profile" step (e.g. confirm alert first)
  deferSignupNavigation = false,
}) => {
  const normalizedPhone =
    provider === 'phone' || phoneNumber
      ? normalizePhoneNumber(phoneNumber || providerId)
      : phoneNumber;
  const normalizedProviderId =
    provider === 'phone' ? normalizePhoneNumber(providerId) : providerId;

  const response = await fetch(`${config.apiUrl}/users/social-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider,
      providerId: normalizedProviderId,
      email,
      firstName,
      lastName,
      phoneNumber: normalizedPhone || undefined,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || 'Social authentication failed');
  }

  if (payload.requiresSignup) {
    const signupParams = {
      provider,
      providerId: normalizedProviderId,
      email: email || '',
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber: normalizedPhone || '',
    };

    if (!deferSignupNavigation) {
      navigation.navigate('SocialSignup', signupParams);
    }

    return { completed: false, requiresSignup: true, signupParams };
  }

  if (!payload.token) {
    throw new Error('No auth token returned from server');
  }

  await AsyncStorage.setItem('userToken', payload.token);
  await persistAuthRole(USER_ROLE.USER);
  setUserRole?.(USER_ROLE.USER);
  setAppMode?.(APP_MODE.CONSUMER);
  if (email) {
    await AsyncStorage.setItem('email', email);
  }
  await AsyncStorage.removeItem('password');
  setUserLoggedIn(true);

  return { completed: true, requiresSignup: false };
};
