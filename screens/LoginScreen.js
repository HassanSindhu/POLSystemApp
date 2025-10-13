import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email.trim() && password.trim()) {
      // Simple validation - any email/password will work for demo
      navigation.replace('MainApp');
    } else {
      Alert.alert('Error', 'Please enter both email and password');
    }
  };

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
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
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
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Demo Info */}
        <View style={styles.demoInfo}>
          <Text style={styles.demoText}>
            Demo: Enter any email and password to login
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
  headerContent: {
    zIndex: 2,
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginHeaderTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  loginHeaderSubtitle: {
    fontSize: 16,
    color: '#e9d5ff',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  loginForm: {
    flex: 1,
    padding: 24,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  demoInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  demoText: {
    color: '#0369a1',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});