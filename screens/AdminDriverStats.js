// screens/AdminDriverStats.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Users list (admin) — requires Bearer token
 * Response: { success, totalCount, data: [{ userId, name, role, mobileNumber, isActive, createdAt }] }
 */
const USERS_VIA_ADMIN_URL =
  'https://gis-lab-eco-tourism.vercel.app/fuel-app/api/user-list/users-via-admin?perPage=20&pageNo=1';

export default function AdminDriverStats({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const normalizeToArray = (resp) => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  };

  const adapt = (u) => ({
    _id: u?.userId || u?._id || `u_${Math.random()}`,
    userId: u?.userId || u?._id || '',
    name: u?.name || 'Unknown',
    mobileNumber: u?.mobileNumber || '',
    role: (u?.role || '').toLowerCase() || 'user',
    isActive: !!u?.isActive,
    createdAt: u?.createdAt || null,
    __raw: u,
  });

  const fetchUsers = useCallback(async () => {
    setError('');
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Not authenticated. Please login again.');

      const res = await fetch(USERS_VIA_ADMIN_URL, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      let data;
      try { data = await res.json(); }
      catch { data = { message: await res.text() }; }

      if (!res.ok) {
        if (res.status === 401) {
          await AsyncStorage.multiRemove(['userToken', 'userData', 'userId']);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data?.message || 'Failed to load users.');
      }

      const list = normalizeToArray(data).map(adapt);
      setUsers(list);
    } catch (e) {
      console.error('[AdminDriverStats] users error:', e);
      setError(e?.message || 'Error loading users.');
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  const onUserPress = (item) => {
    const userId = item?.userId || item?._id;
    if (!userId) {
      Alert.alert('Missing ID', 'User ID not found for this user.');
      return;
    }
    navigation.navigate('AdminDriverDetails', {
      userId,
      user: item,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onUserPress(item)}
      activeOpacity={0.85}
    >
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.meta}>📞 {item.mobileNumber || '—'}</Text>
      <Text style={styles.meta}>🎖️ Role: {item.role}</Text>
      <Text style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
        {item.isActive ? 'Active' : 'Inactive'}
      </Text>
      <Text style={styles.hint}>View details (fuel + travel) →</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.subtitle}>Tap a user to view fuel & travel logs</Text>
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading users…</Text>
        </View>
      ) : error ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity onPress={fetchUsers} style={styles.retryBtn}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          data={users}
          keyExtractor={(item) => item._id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 24 }}>
              No users found.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#e9d5ff', marginTop: 6, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  name: { fontSize: 18, fontWeight: '800', color: '#111827' },
  meta: { marginTop: 6, color: '#6b7280' },
  hint: { marginTop: 10, color: '#6b7280', fontSize: 13 },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    color: '#111827',
  },
  badgeActive: { backgroundColor: '#d1fae5' },
  badgeInactive: { backgroundColor: '#fee2e2' },

  retryBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
