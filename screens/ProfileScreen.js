// screens/ProfileScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_URL = 'https://gis-lab-eco-tourism.vercel.app/fuel-app/api/user-list/user-profile';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);          // raw user object from AsyncStorage (login)
  const [profile, setProfile] = useState(null);            // API profile payload (profile: {...})
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Load cached login user for fallback (name/role/createdAt, etc.)
  useEffect(() => {
    (async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) setUserData(JSON.parse(userDataString));
      } catch (e) {
        console.log('load userData error:', e);
      }
    })();
  }, []);

  const fetchProfile = useCallback(async () => {
    setError('');
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Not authenticated. Please login again.');

      const res = await fetch(PROFILE_URL, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type for GET
      });

      let data;
      try { data = await res.json(); }
      catch { data = { message: await res.text() }; }

      if (!res.ok) {
        if (res.status === 401) {
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data?.message || 'Failed to load profile.');
      }

      setProfile(data?.profile || null);
    } catch (e) {
      console.error('[Profile] fetch error:', e);
      setError(e?.message || 'Error loading profile.');
      setProfile(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  // Derived display fields (fall back to userData if API missing)
  const displayName = useMemo(() => {
    return profile?.driverName || userData?.name || '—';
  }, [profile, userData]);

  const displayMobile = useMemo(() => {
    return profile?.mobileNumber || userData?.mobileNumber || '—';
  }, [profile, userData]);

  const displayRole = useMemo(() => {
    return (profile?.role || userData?.role || 'user').toString();
  }, [profile, userData]);

  const joinedDate = useMemo(() => {
    // API response doesn’t include createdAt; we’ll show userData.createdAt if available.
    const src = userData?.createdAt ? new Date(userData.createdAt) : null;
    return src ? src.toLocaleDateString() : '—';
  }, [userData]);

  // Stats from API
  const totalTrips = profile?.totalTrips ?? 0;
  const fuelRecords = profile?.fuelRecords ?? 0;
  const distanceKm = profile?.distanceCoveredKm ?? 0;
  const totalFuelCost = profile?.totalFuelCost ?? 0;

  // “Pending” isn’t provided by this API. We’ll show “—” to make this explicit.
  const pendingTravels = '—';

  // Logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['userToken', 'userData']);
              navigation.replace('Login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.screenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
        <View style={styles.loadingBox}>
          <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity onPress={fetchProfile} style={styles.retryBtn}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.header}>Profile</Text>
            <Text style={styles.subHeader}>Your account overview</Text>
          </View>
          <View style={styles.headerDecoration} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
      >
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{displayMobile}</Text>
              <Text style={styles.userRole}>{displayRole}</Text>
              <Text style={styles.joinDate}>
                Joined {joinedDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalTrips}</Text>
              <Text style={styles.statLabel}>Total Travels</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{pendingTravels}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{fuelRecords}</Text>
              <Text style={styles.statLabel}>Fuel Records</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{distanceKm}km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
          </View>
        </View>

        {/* Financial Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>

          <View style={styles.financeCard}>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Total Fuel Cost</Text>
              <Text style={styles.financeValue}>Rs {Number(totalFuelCost).toLocaleString()}</Text>
            </View>

            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Average per Travel</Text>
              <Text style={styles.financeValue}>
                {totalTrips > 0
                  ? `Rs ${Math.round(totalFuelCost / totalTrips).toLocaleString()}`
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View className="actions" style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Edit Profile', 'Coming soon')}>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => Alert.alert('Change Password', 'Coming soon')}
          >
            <Text style={styles.actionButtonSecondaryText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleLogout}
          >
            <Text style={styles.actionButtonDangerText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f8fafc' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 16, color: '#6b7280', fontWeight: '500', marginTop: 10 },
  retryBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  headerContainer: {
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    position: 'relative',
  },
  headerContent: { zIndex: 2 },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 8, letterSpacing: -0.5 },
  subHeader: { fontSize: 16, color: '#e9d5ff', fontWeight: '500', letterSpacing: 0.3 },

  container: { padding: 24 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#7c3aed',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  avatarText: { color: '#ffffff', fontSize: 20, fontWeight: '700' },

  userDetails: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  userRole: { fontSize: 14, color: '#7c3aed', fontWeight: '600', marginBottom: 4 },
  joinDate: { fontSize: 12, color: '#9ca3af' },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20, fontWeight: '800', color: '#374151', marginBottom: 16, letterSpacing: -0.3,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#7c3aed', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', textAlign: 'center' },

  financeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  financeItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  financeLabel: { fontSize: 16, color: '#374151', fontWeight: '600' },
  financeValue: { fontSize: 16, color: '#7c3aed', fontWeight: '700' },

  actionButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7c3aed',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonDanger: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowOpacity: 0,
    elevation: 0,
    marginTop: 8,
  },
  actionButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  actionButtonSecondaryText: { color: '#7c3aed', fontWeight: '700', fontSize: 16 },
  actionButtonDangerText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});
