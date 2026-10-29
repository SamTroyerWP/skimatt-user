import React, { useContext, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import NavigationContext from '../context/NavigationContext';
import { completeUserSocialAuth } from '../utils/userSocialAuth';
import { normalizePhoneNumber } from '../utils/phoneNumber';

export default function SocialSignup({ route, navigation }) {
  const { setUserLoggedIn, setUserRole, setAppMode } = useContext(NavigationContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    provider,
    providerId,
    email: initialEmail,
    firstName: initialFirstName,
    lastName: initialLastName,
    phoneNumber: initialPhone,
  } = route.params || {};

  const [firstName, setFirstName] = useState(initialFirstName || '');
  const [lastName, setLastName] = useState(initialLastName || '');
  const [phoneNumber, setPhoneNumber] = useState(normalizePhoneNumber(initialPhone) || '');
  const [email, setEmail] = useState(initialEmail || '');

  const phoneLocked = provider === 'phone' && Boolean(initialPhone);

  const handleFinishSignup = async () => {
    setError('');

    if (!provider || !providerId) {
      setError('Missing social account information. Please try again.');
      return;
    }

    if (!firstName || !lastName || !phoneNumber || !email) {
      setError('Please complete all fields.');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const resolvedProviderId =
      provider === 'phone' ? normalizedPhone : providerId;

    setLoading(true);
    try {
      await completeUserSocialAuth({
        provider,
        providerId: resolvedProviderId,
        email,
        firstName,
        lastName,
        phoneNumber: normalizedPhone,
        navigation,
        setUserLoggedIn,
        setUserRole,
        setAppMode,
      });
    } catch (e) {
      setError(e.message || 'Unable to complete sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            One more step to finish signing up with {provider === 'phone' ? 'your phone number' : provider}.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor="#5b5b5b"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Last name"
            placeholderTextColor="#5b5b5b"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          {!phoneLocked ? (
            <TextInput
              style={styles.input}
              placeholder="Phone number (+1...)"
              placeholderTextColor="#5b5b5b"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          ) : (
            <View style={styles.lockedField}>
              <Text style={styles.lockedLabel}>Verified phone</Text>
              <Text style={styles.lockedValue}>{phoneNumber}</Text>
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#5b5b5b"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleFinishSignup} disabled={loading}>
            <Text style={styles.primaryButtonText}>Finish sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('EnterApp')} disabled={loading}>
            <Text style={styles.secondaryButtonText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>

        <ActivityIndicator animating={loading} style={loading ? styles.loading : styles.hidden} size="large" />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c12818',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffebd6',
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#c12818',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#c12818',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f4835b',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 10,
    color: '#941004',
    fontSize: 16,
  },
  lockedField: {
    backgroundColor: '#f4835b',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  lockedLabel: {
    color: '#5b5b5b',
    fontSize: 12,
    marginBottom: 2,
  },
  lockedValue: {
    color: '#c12818',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#7d0000',
    textAlign: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#f4835b',
    borderRadius: 24,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#941004',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#c12818',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#00000050',
  },
  hidden: {
    display: 'none',
  },
});
