import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppModeToggle from './AppModeToggle';

export default function AuthModeBanner({ label = 'I am signing in as a' }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.label}>{label}</Text>
      <AppModeToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  label: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#c12818',
  },
});
