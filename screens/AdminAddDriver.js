import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SIGNUP_API = 'https://gis-lab-eco-tourism.vercel.app/fuel-app/api/auth/signup';

export default function AdminAddDriver() {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver'); // default to "driver"
  const [token, setToken] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('userToken');
        setToken(t);
      } catch (e) {
        console.log('Token read error:', e);
      }
    })();
  }, []);

  const isFormValid =
    name.trim().length > 0 &&
    /^03\d{9}$/.test(mobileNumber.trim()) &&
    password.trim().length >= 6 &&
    !!role;

  const resetForm = () => {
    setName('');
    setMobileNumber('');
    setPassword('');
    setRole('driver');
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    if (!isFormValid) {
      Alert.alert('Missing / Invalid', 'Please fill all fields correctly.');
      return;
    }
    if (!token) {
      Alert.alert('Auth', 'Missing token. Please login again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        password: password.trim(),
        role, // "driver" by default; can select "admin" if needed
      };

      const res = await fetch(SIGNUP_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data;
      try { data = await res.json(); }
      catch { data = { message: await res.text() }; }

      if (!res.ok) {
        if (res.status === 401) {
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          Alert.alert('Session expired', 'Please login again.');
          return;
        }
        throw new Error(data?.message || 'Failed to create user');
      }

      Alert.alert('Success', `User created successfully${data?.user?.name ? `: ${data.user.name}` : ''}`);
      resetForm();
    } catch (e) {
      console.error('Signup error:', e);
      Alert.alert('Error', e?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, isSubmitting, token, name, mobileNumber, password, role]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      <View style={styles.header}>
        <Text style={styles.title}>Add Driver / User</Text>
        <Text style={styles.subtitle}>Create a new account (driver by default)</Text>
      </View>

      <View style={styles.form}>
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Ali Khan"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            editable={!isSubmitting}
            returnKeyType="next"
          />
        </View>

        {/* Mobile */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number (03XXXXXXXXX)</Text>
          <TextInput
            style={styles.input}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            placeholder="03335900657"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            maxLength={11}
            editable={!isSubmitting}
            returnKeyType="next"
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password (min 6 chars)</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            editable={!isSubmitting}
            returnKeyType="done"
          />
        </View>

        {/* Role */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={role}
              onValueChange={setRole}
              enabled={!isSubmitting}
              style={styles.picker}
              dropdownIconColor="#7c3aed"
            >
              <Picker.Item label="Driver" value="driver" />
              <Picker.Item label="Admin" value="admin" />
            </Picker>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          style={[
            styles.submitBtn,
            (!isFormValid || isSubmitting) && styles.submitBtnDisabled,
          ]}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={[styles.submitText, { marginLeft: 12 }]}>Submitting…</Text>
            </>
          ) : (
            <Text style={styles.submitText}>Create User</Text>
          )}
        </TouchableOpacity>

        {/* Helper */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            • Default role is <Text style={{ fontWeight: '700' }}>driver</Text>.{'\n'}
            • You can also create <Text style={{ fontWeight: '700' }}>admin</Text> users from here if needed.{'\n'}
            • Requires a valid session token (admin).
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#e9d5ff', marginTop: 6, fontWeight: '600' },

  form: { padding: 16 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#374151', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 14, fontSize: 16,
    color: '#1f2937', backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 16, backgroundColor: '#fff',
    overflow: 'hidden', elevation: 2,
  },
  picker: { color: '#1f2937', fontSize: 16 },

  submitBtn: {
    backgroundColor: '#0ea5e9', paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 10, marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: '#9ca3af' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },

  noteBox: {
    marginTop: 16, backgroundColor: '#fffbeb', borderColor: '#fde68a',
    borderWidth: 1, borderRadius: 12, padding: 12,
  },
  noteText: { color: '#92400e', fontSize: 12, lineHeight: 18 },
});
