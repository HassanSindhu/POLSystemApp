// screens/AdminDriverDetails.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FUEL_URL = (userId, pageNo = 1, perPage = 10) =>
  `https://gis-lab-eco-tourism.vercel.app/fuel-app/api/fuel/fuel-record/driver/${encodeURIComponent(
    userId
  )}?perPage=${perPage}&pageNo=${pageNo}`;

const TRAVEL_URL = (userId, pageNo = 1, perPage = 10) =>
  `https://gis-lab-eco-tourism.vercel.app/fuel-app/api/travel/all-travel-logs/driver/${encodeURIComponent(
    userId
  )}?perPage=${perPage}&pageNo=${pageNo}`;

export default function AdminDriverDetails({ route, navigation }) {
  // From AdminDriverStats: { userId, user }
  const passedUser = route.params?.user;
  const passedUserId = route.params?.userId || passedUser?.userId || passedUser?._id;

  const [fuelLogs, setFuelLogs] = useState([]);
  const [travelLogs, setTravelLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // NEW: simple tab state
  const [tab, setTab] = useState('fuel'); // 'fuel' | 'travel'

  useEffect(() => {
    navigation.setOptions?.({
      headerShown: true,
      title: passedUser?.name ? `${passedUser.name}` : 'Driver Details',
    });
  }, [navigation, passedUser?.name]);

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(); }
    catch { return iso || ''; }
  };

  const adaptFuel = (r) => ({
    id: r?._id || `fuel_${Math.random()}`,
    vehicle: r?.vehicle || '',
    liters: Number(r?.liters ?? 0),
    pricePerLiter: Number(r?.pricePerLiter ?? 0),
    totalAmount: Number(r?.totalAmount ?? 0),
    preMeter: r?.preMeter || '',
    timestamp: r?.timestamp || r?.createdAt || '',
    images: {
      preMeterImg: r?.images?.preMeterImg || r?.preMeterImg || null,
      machineMeterImg: r?.images?.machineMeterImg || r?.machineMeterImg || null,
      receiptImg: r?.images?.receiptImg || r?.receiptImg || null,
    },
    raw: r,
  });

  const adaptTravel = (r) => {
    const pre = Number(r?.preMeter ?? 0);
    const post = Number(r?.postMeter ?? 0);
    const apiKm =
      (Number.isFinite(r?.distanceKm) && r.distanceKm) ||
      (Number.isFinite(r?.distanceKM) && r.distanceKM) ||
      (Number.isFinite(r?.DistanceKM) && r.DistanceKM) ||
      (Number.isFinite(r?.distance) && r.distance);
    const km = Number.isFinite(apiKm) ? apiKm : Math.max(0, (Number.isFinite(post) ? post : 0) - (Number.isFinite(pre) ? pre : 0));

    return {
      id: r?._id || `travel_${Math.random()}`,
      status: (r?.status || '').toLowerCase(),
      officer: r?.officer || '',
      vehicle: r?.vehicle || '',
      from: r?.travelFrom || r?.from || '',
      to: r?.travelTo || r?.to || '',
      preMeter: pre || '',
      postMeter: post || '',
      distanceKm: km,
      fuelPercent: Number(r?.fuelPercent ?? 0),
      startedAt: r?.timestamp || r?.createdAt || '',
      completedAt: r?.completedAt || r?.updatedAt || '',
      preMeterImg: r?.preMeterImg || null,
      postMeterImg: r?.postMeterImg || null,
      fuelMeterImg: r?.fuelMeterImg || null,
      raw: r,
    };
  };

  const fetchBoth = useCallback(async () => {
    setError('');
    if (!passedUserId) {
      setLoading(false);
      setFuelLogs([]);
      setTravelLogs([]);
      setError('User ID missing.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Not authenticated. Please login again.');

      const [fuelRes, travelRes] = await Promise.all([
        fetch(FUEL_URL(passedUserId), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(TRAVEL_URL(passedUserId), { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      // Fuel
      let fuelData;
      try { fuelData = await fuelRes.json(); } catch { fuelData = { message: await fuelRes.text() }; }
      if (!fuelRes.ok) {
        if (fuelRes.status === 401) {
          await AsyncStorage.multiRemove(['userToken', 'userData', 'userId']);
          throw new Error(fuelData?.message || 'Session expired. Please login again.');
        }
        throw new Error(fuelData?.message || 'Failed to load fuel logs.');
      }

      // Travel
      let travelData;
      try { travelData = await travelRes.json(); } catch { travelData = { message: await travelRes.text() }; }
      if (!travelRes.ok) {
        if (travelRes.status === 401) {
          await AsyncStorage.multiRemove(['userToken', 'userData', 'userId']);
          throw new Error(travelData?.message || 'Session expired. Please login again.');
        }
        throw new Error(travelData?.message || 'Failed to load travel logs.');
      }

      const fuelArr = Array.isArray(fuelData?.data) ? fuelData.data : (Array.isArray(fuelData) ? fuelData : []);
      const travelArr = Array.isArray(travelData?.data) ? travelData.data : (Array.isArray(travelData) ? travelData : []);

      const fuel = fuelArr.map(adaptFuel).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      const travel = travelArr.map(adaptTravel).sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));

      setFuelLogs(fuel);
      setTravelLogs(travel);
    } catch (e) {
      console.error('[AdminDriverDetails] fetch error:', e);
      setError(e?.message || 'Error loading driver details.');
      setFuelLogs([]);
      setTravelLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [passedUserId]);

  useEffect(() => {
    setLoading(true);
    fetchBoth();
  }, [fetchBoth]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBoth();
  }, [fetchBoth]);

  // ----- UI bits -----
  const SectionHeader = ({ title }) => <Text style={styles.sectionTitle}>{title}</Text>;

  const Thumb = ({ uri, caption }) => (
    <View style={styles.thumbWrap}>
      <Image source={{ uri }} style={styles.thumb} />
      {!!caption && <Text style={styles.thumbCap} numberOfLines={1}>{caption}</Text>}
    </View>
  );

  const FuelRow = ({ item }) => (
    <View style={styles.rowCard}>
      <Text style={styles.rowTitle}>{fmtDate(item.timestamp)}</Text>
      <Text style={styles.rowMeta}>Vehicle: {item.vehicle || '—'}</Text>
      <Text style={styles.rowMeta}>
        Liters: <Text style={styles.rowStrong}>{item.liters}</Text> @ Rs {item.pricePerLiter} •
        Total: <Text style={styles.rowStrong}>Rs {item.totalAmount}</Text>
      </Text>
      {!!item.preMeter && <Text style={styles.rowMeta}>Pre Meter: {item.preMeter}</Text>}

      {(item.images?.preMeterImg || item.images?.machineMeterImg || item.images?.receiptImg) && (
        <View style={styles.imgRow}>
          {item.images?.preMeterImg && <Thumb uri={item.images.preMeterImg} caption="Pre" />}
          {item.images?.machineMeterImg && <Thumb uri={item.images.machineMeterImg} caption="Machine" />}
          {item.images?.receiptImg && <Thumb uri={item.images.receiptImg} caption="Receipt" />}
        </View>
      )}
    </View>
  );

  const TravelRow = ({ item }) => (
    <View style={styles.rowCard}>
      <Text style={styles.rowTitle}>{fmtDate(item.startedAt)}</Text>
      <Text style={styles.rowMeta}>
        {item.from || '—'} → {item.to || '—'} • Vehicle: {item.vehicle || '—'}
      </Text>
      <Text style={styles.rowMeta}>
        Status:{' '}
        <Text style={[styles.badge, item.status === 'completed' ? styles.badgeDone : styles.badgePending]}>
          {item.status}
        </Text>
      </Text>
      <Text style={styles.rowMeta}>
        Distance: <Text style={styles.rowStrong}>{item.distanceKm}</Text> km
        {!!item.fuelPercent || item.fuelPercent === 0 ? ` • Fuel: ${item.fuelPercent}%` : ''}
      </Text>
      {(item.preMeterImg || item.postMeterImg || item.fuelMeterImg) && (
        <View style={styles.imgRow}>
          {item.preMeterImg && <Thumb uri={item.preMeterImg} caption="Pre" />}
          {item.postMeterImg && <Thumb uri={item.postMeterImg} caption="Post" />}
          {item.fuelMeterImg && <Thumb uri={item.fuelMeterImg} caption="Fuel" />}
        </View>
      )}
      {!!item.completedAt && <Text style={styles.rowDim}>Completed: {fmtDate(item.completedAt)}</Text>}
    </View>
  );

  const EmptyFuel = useMemo(() => <Text style={styles.emptyText}>No fuel records.</Text>, []);
  const EmptyTravel = useMemo(() => <Text style={styles.emptyText}>No travel logs.</Text>, []);

  // Tab header UI
  const TabButton = ({ value, label, count }) => {
    const active = tab === value;
    return (
      <TouchableOpacity
        onPress={() => setTab(value)}
        activeOpacity={0.8}
        style={[styles.tabBtn, active && styles.tabBtnActive]}
      >
        <Text style={[styles.tabText, active && styles.tabTextActive]}>
          {label}{typeof count === 'number' ? ` (${count})` : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      {/* Top fixed user header */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>{passedUser?.name || 'User'}</Text>
        {!!passedUser?.mobileNumber && <Text style={styles.meta}>📞 {passedUser.mobileNumber}</Text>}
        {!!passedUser?.role && <Text style={styles.meta}>Role: {passedUser.role}</Text>}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TabButton value="fuel" label="Fuel" count={fuelLogs.length} />
        <TabButton value="travel" label="Travel" count={travelLogs.length} />
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading details…</Text>
        </View>
      ) : error ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 8 }}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        >
          {tab === 'fuel' ? (
            <View style={styles.block}>
              <SectionHeader title="Fuel Purchases" />
              {fuelLogs.length === 0 ? (
                EmptyFuel
              ) : (
                fuelLogs.map((it) => <FuelRow key={it.id} item={it} />)
              )}
            </View>
          ) : (
            <View style={styles.block}>
              <SectionHeader title="Travel Journeys" />
              {travelLogs.length === 0 ? (
                EmptyTravel
              ) : (
                travelLogs.map((it) => <TravelRow key={it.id} item={it} />)
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8fafc' },

  headerCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    margin: 16,
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  meta: { marginTop: 6, color: '#6b7280' },

  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#e9d5ff',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#6d28d9',
  },
  tabText: { color: '#6b21a8', fontWeight: '700' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1 },

  block: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#374151', marginBottom: 12 },

  rowCard: {
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  rowTitle: { fontWeight: '700', color: '#111827' },
  rowMeta: { color: '#374151', marginTop: 4 },
  rowStrong: { fontWeight: '800', color: '#111827' },
  rowDim: { color: '#6b7280', marginTop: 6, fontSize: 12 },

  imgRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  thumbWrap: { width: 84, alignItems: 'center' },
  thumb: { width: 84, height: 84, borderRadius: 8, backgroundColor: '#f3f4f6' },
  thumbCap: { marginTop: 6, fontSize: 12, color: '#6b7280' },

  badge: {
    textTransform: 'capitalize',
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 2 : 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeDone: { backgroundColor: '#d1fae5', color: '#065f46', fontWeight: '700' },
  badgePending: { backgroundColor: '#fee2e2', color: '#7f1d1d', fontWeight: '700' },

  emptyText: { color: '#6b7280', textAlign: 'center', marginVertical: 6 },
});
