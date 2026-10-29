import { Platform } from 'react-native';

/**
 * Best-effort device phone number detection.
 * iOS never exposes the SIM number to apps.
 * Android rarely does without Google Phone Number Hint (native module).
 * Returns a normalized string or null so callers can fall back to manual entry.
 */
export async function tryGetDevicePhoneNumber() {
  try {
    if (Platform.OS === 'ios') {
      return null;
    }

    // Placeholder for a future Phone Number Hint / native module integration.
    // Until then, always fall back to the manual phone form.
    return null;
  } catch (error) {
    console.warn('Unable to detect device phone number:', error);
    return null;
  }
}
