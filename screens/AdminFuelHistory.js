import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://gis-lab-eco-tourism.vercel.app/fuel-app/api/fuel/fuel-records';

export default function AdminFuelHistory({ route, navigation }) {
  const vehicle = route.params?.vehicle;
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Missing token. Please login again.');

      const res = await fetch(`${API_BASE}?vehicle=${encodeURIComponent(vehicle)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data;
      try { data = await res.json(); }
      catch { data = { message: await res.text() }; }

      if (!res.ok) {
        if (res.status === 401) {
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data?.message || 'Failed to fetch records');
      }

      setRecords(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e?.message || 'Error loading records');
    } finally {
      setLoading(false);
    }
  }, [vehicle]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    navigation.setOptions?.({ headerShown: true, title: vehicle || 'Fuel History' });
  }, [navigation, vehicle]);

  const Item = ({ item }) => {
    const ts = item?.timestamp ? new Date(item.timestamp) : null;
    const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
    const loc = item?.location?.coordinates; // [lng, lat]
    const lng = Array.isArray(loc) ? loc[0] : null;
    const lat = Array.isArray(loc) ? loc[1] : null;

    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.vehicle}>{item.vehicle}</Text>
          {ts && <Text style={styles.date}>{ts.toLocaleString()}</Text>}
        </View>

        <Text style={styles.row}>Liters: <Text style={styles.bold}>{item.liters}</Text></Text>
        <Text style={styles.row}>Price/L: <Text style={styles.bold}>{item.pricePerLiter}</Text></Text>
        <Text style={styles.row}>Total: <Text style={styles.bold}>Rs {item.totalAmount}</Text></Text>
        <Text style={styles.row}>Pre Meter: <Text style={styles.bold}>{item.preMeter}</Text></Text>

        {lat != null && lng != null && (
          <Text style={styles.coords}>📍 {lat.toFixed(6)}, {lng.toFixed(6)}</Text>
        )}

        {!!item?.createdBy?.name && (
          <Text style={styles.meta}>By: {item.createdBy.name} ({item.createdBy.role})</Text>
        )}
        {createdAt && <Text style={styles.meta}>Created: {createdAt.toLocaleString()}</Text>}

        <View style={styles.imagesRow}>
          {item?.images?.preMeterImg ? (
            <Image source={{ uri: item.images.preMeterImg }} style={styles.img} />
          ) : null}
          {item?.images?.machineMeterImg ? (
            <Image source={{ uri: item.images.machineMeterImg }} style={styles.img} />
          ) : null}
          {item?.images?.receiptImg ? (
            <Image source={{ uri: item.images.receiptImg }} style={styles.img} />
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchRecords}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#7c3aed" />
      <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading {vehicle} records…</Text>
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={{ color: '#ef4444', marginBottom: 8 }}>{error}</Text>
      <TouchableOpacity style={styles.retry} onPress={fetchRecords}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      data={records}
      keyExtractor={(it) => it?._id || String(Math.random())}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => <Item item={item} />}
      ListEmptyComponent={() => (
        <View style={styles.center}>
          <Text style={{ color: '#6b7280' }}>No records found for {vehicle}.</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  vehicle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  date: { color: '#6b7280', fontSize: 12 },
  row: { color: '#374151', marginTop: 6 },
  bold: { fontWeight: '700', color: '#111827' },
  coords: { marginTop: 8, color: '#0369a1', fontWeight: '700' },
  meta: { marginTop: 4, color: '#6b7280', fontSize: 12 },
  imagesRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  img: { width: 84, height: 84, borderRadius: 10, backgroundColor: '#f3f4f6' },
  refreshBtn: {
    marginTop: 12, alignSelf: 'flex-end',
    backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  refreshText: { color: '#fff', fontWeight: '700' },
  retry: { backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
});
