import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://gis-lab-eco-tourism.vercel.app/fuel-app/api';

export default function LoginScreen({ navigation }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Centralized route-by-role
  const routeByRole = (user) => {
    const role = user?.role?.toLowerCase?.() || '';
    if (role === 'admin') {
      navigation.reset({ index: 0, routes: [{ name: 'AdminApp' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userDataStr = await AsyncStorage.getItem('userData');

        if (token && userDataStr) {
          const user = JSON.parse(userDataStr);
          routeByRole(user);
          return;
        }
      } catch (error) {
        console.error('Error checking existing login:', error);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkExistingLogin();
  }, [navigation]);

  // Store token and user data (+ userId separately)
  const storeUserData = async (token, user) => {
    const userId = user?._id ? String(user._id) : '';
    await AsyncStorage.multiSet([
      ['userToken', token],
      ['userData', JSON.stringify(user)],
      ['userId', userId],
    ]);
  };

  const handleLogin = async () => {
    if (isLoading) return;

    // Validation
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    // Basic mobile number validation (Pakistan format 03XXXXXXXXX)
    const mobileRegex = /^03\d{9}$/;
    if (!mobileRegex.test(mobileNumber.trim())) {
      Alert.alert('Error', 'Please enter a valid mobile number (03XXXXXXXXX)');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber: mobileNumber.trim(),
          password: password.trim(),
        }),
      });

      let data;
      try { data = await response.json(); }
      catch { data = { message: await response.text() }; }

      if (response.ok && data?.token && data?.user) {
        await storeUserData(data.token, data.user);
        Alert.alert('Success', `Welcome back, ${data.user.name}!`);
        routeByRole(data.user);
      } else {
        Alert.alert('Login Failed', data?.message || 'Invalid mobile number or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login for testing (prefill only)
  const handleDemoLogin = () => {
    if (isLoading) return;
    setMobileNumber('03335900657');
    setPassword('Test@1234');
    Alert.alert(
      'Demo Credentials',
      'Mobile: 03335900657\nPassword: Test@1234\n\nClick Sign In to login with demo credentials.'
    );
  };

  // Splash while checking token
  if (isCheckingToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Checking login status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.loginContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Login Header */}
      <View style={styles.loginHeader}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.loginHeaderTitle}>Welcome Back</Text>
            <Text style={styles.loginHeaderSubtitle}>Sign in to continue</Text>
          </View>
          <View style={styles.headerDecoration} />
        </View>
      </View>

      <View style={styles.loginForm}>
        {/* Mobile Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            placeholder="Enter your mobile number"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            autoCapitalize="none"
            maxLength={11}
            editable={!isLoading}
            returnKeyType="next"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            editable={!isLoading}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Demo Login Button */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleDemoLogin}
          disabled={isLoading}
        >
          <Text style={styles.demoButtonText}>Use Demo Credentials</Text>
        </TouchableOpacity>

        {/* Demo Info */}
        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>Demo Credentials</Text>
          <Text style={styles.demoText}>
            Mobile: 03335900657{'\n'}
            Password: Test@1234
          </Text>
          <Text style={styles.demoNote}>
            Use the "Use Demo Credentials" button to auto-fill
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16, fontSize: 16, color: '#6b7280', fontWeight: '500',
  },
  loginHeader: {
    backgroundColor: '#7c3aed',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  headerBackground: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 60,
    position: 'relative',
  },
  headerContent: { zIndex: 2 },
  headerDecoration: {
    position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginHeaderTitle: {
    fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 8, letterSpacing: -0.5,
  },
  loginHeaderSubtitle: {
    fontSize: 16, color: '#e9d5ff', fontWeight: '500', letterSpacing: 0.3,
  },
  loginForm: {
    flex: 1, padding: 24, marginTop: 20,
  },
  inputContainer: { marginBottom: 24 },
  inputLabel: {
    color: '#374151', fontSize: 16, fontWeight: '700', marginBottom: 10, letterSpacing: -0.2,
  },
  input: {
    borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, color: '#1f2937',
    backgroundColor: '#ffffff', fontWeight: '500',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  loginButton: {
    backgroundColor: '#7c3aed', paddingVertical: 18, borderRadius: 20, alignItems: 'center',
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12, marginTop: 16,
    borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginButtonDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0.2 },
  loginButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 18, letterSpacing: 0.5 },
  demoButton: {
    backgroundColor: 'transparent', paddingVertical: 14, borderRadius: 16, alignItems: 'center',
    borderWidth: 2, borderColor: '#7c3aed', marginTop: 12,
  },
  demoButtonText: { color: '#7c3aed', fontWeight: '600', fontSize: 16 },
  demoInfo: {
    marginTop: 24, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e0f2fe',
  },
  demoTitle: { color: '#0369a1', fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  demoText: {
    color: '#0369a1', fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20,
  },
  demoNote: { color: '#0284c7', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});
