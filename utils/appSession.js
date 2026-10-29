import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_MODE_KEY = 'appMode';
export const USER_ROLE_KEY = 'userRole';

export const APP_MODE = {
  CONSUMER: 'consumer',
  PROVIDER: 'provider',
};

export const USER_ROLE = {
  USER: 'user',
  PROVIDER: 'provider',
};

export const modeFromRole = (role, fallback = APP_MODE.CONSUMER) => {
  if (role === USER_ROLE.PROVIDER) return APP_MODE.PROVIDER;
  if (role === USER_ROLE.USER) return APP_MODE.CONSUMER;
  return fallback;
};

export const persistAppMode = async (mode) => {
  await AsyncStorage.setItem(APP_MODE_KEY, mode);
};

export const persistAuthRole = async (role) => {
  const mode = modeFromRole(role);
  await AsyncStorage.setItem(USER_ROLE_KEY, role);
  await persistAppMode(mode);
  return mode;
};
