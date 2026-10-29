import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NavigationContext from '../context/NavigationContext';
import { APP_MODE } from '../utils/appSession';

export default function AppModeToggle() {
  const { appMode, setAppMode } = useContext(NavigationContext);

  return (
    <View style={styles.row} accessibilityRole="tablist">
      <TouchableOpacity
        style={[styles.button, appMode === APP_MODE.PROVIDER && styles.buttonActive]}
        onPress={() => setAppMode(APP_MODE.PROVIDER)}
        accessibilityRole="tab"
        accessibilityState={{ selected: appMode === APP_MODE.PROVIDER }}
      >
        <Text style={[styles.label, appMode === APP_MODE.PROVIDER && styles.labelActive]}>
          Resort/Resort
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, appMode === APP_MODE.CONSUMER && styles.buttonActive]}
        onPress={() => setAppMode(APP_MODE.CONSUMER)}
        accessibilityRole="tab"
        accessibilityState={{ selected: appMode === APP_MODE.CONSUMER }}
      >
        <Text style={[styles.label, appMode === APP_MODE.CONSUMER && styles.labelActive]}>
          guest
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#f7f3f0',
    borderColor: '#e8ddd6',
    borderWidth: 1,
    borderRadius: 999,
    padding: 3,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  buttonActive: {
    backgroundColor: '#e8987c',
  },
  label: {
    color: '#c12818',
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#fff',
  },
});
