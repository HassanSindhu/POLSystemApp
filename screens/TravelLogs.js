// screens/TravelLogs.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  Platform, StatusBar, Animated, TextInput, ScrollView, Image,
  ActivityIndicator, RefreshControl, PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import ImageCaptureRow from '../components/ImageCaptureRow';
import Geolocation from '@react-native-community/geolocation';

const STORAGE_KEY = 'TRAVEL_LOGS';
const Stack = createNativeStackNavigator();

// ---- API endpoints ----
const API_BASE = 'https://gis-lab-eco-tourism.vercel.app/fuel-app/api';
const PENDING_URL = `${API_BASE}/travel/travel-logs/pending`;
const COMPLETE_BASE_URL = `${API_BASE}/travel/travel-logs`;
const COMPLETED_BY_TOKEN_URL = `${API_BASE}/travel/travel-logs/driver/completed?perPage=10&pageNo=1`;
const BUCKET_UPLOAD_URL = 'https://cms-dev.gisforestry.com/backend/upload/new';

/** Session helper: token + userId (driverId) from AsyncStorage */
const getSession = async () => {
  const token = await AsyncStorage.getItem('userToken');
  let userId = await AsyncStorage.getItem('userId'); // stored at login
  if (!token) throw new Error('Not authenticated. Please login again.');
  if (!userId) {
    const userDataStr = await AsyncStorage.getItem('userData');
    const user = userDataStr ? JSON.parse(userDataStr) : null;
    if (user?._id) userId = String(user._id);
  }
  if (!userId) throw new Error('Driver ID not found in session.');
  return { token, userId };
};

/** ---------- Root wrapper with inner Stack (List -> Complete) ---------- */
export default function TravelLogs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: Platform.OS === 'ios' ? 'default' : 'fade' }}>
      <Stack.Screen name="TravelLogsList" component={TravelLogsList} />
      <Stack.Screen name="TravelLogComplete" component={TravelLogComplete} />
    </Stack.Navigator>
  );
}

/** ---------------------------- LIST SCREEN ---------------------------- */
function TravelLogsList({ navigation }) {
  const [pendingLogs, setPendingLogs] = useState([]);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | completed

  // ---- Map server rows to local shape (handles multiple field names/cases) ----
  const adaptServerRow = (r) => {
    const pre = Number(r?.preMeter ?? r?.pre_odometer ?? 0);
    const post = Number(r?.postMeter ?? r?.post_odometer ?? 0);

    // Prefer API's distance if provided (distanceKm / distanceKM / DistanceKM / distance)
    const apiKm =
      (Number.isFinite(r?.distanceKm) && r.distanceKm) ??
      (Number.isFinite(r?.distanceKM) && r.distanceKM) ??
      (Number.isFinite(r?.DistanceKM) && r.DistanceKM) ??
      (Number.isFinite(r?.distance) && r.distance);

    const km = Number.isFinite(apiKm)
      ? apiKm
      : Math.max(0, (Number.isFinite(post) ? post : 0) - (Number.isFinite(pre) ? pre : 0));

    const fuelPct =
      typeof r?.fuelPercent === 'number' ? r.fuelPercent :
      typeof r?.fuel === 'number' ? r.fuel :
      0;

    return {
      id: r?._id || `srv_${Math.random()}`,
      officer: r?.officer || r?.driverName || '',
      from: r?.travelFrom || r?.from || '',
      to: r?.travelTo || r?.to || '',
      preMeter: pre || '',
      preMeterImg: r?.preMeterImg || r?.preMeterImage || r?.pre_odometer_image || null,
      // keep raw to collect images later on details screen
      raw: r,
      meta: {
        timestamp: r?.timestamp || r?.createdAt || r?.startTime || new Date().toISOString(),
      },
      post: (r?.status || '').toLowerCase() === 'completed'
        ? {
            completed: true,
            postMeter: post || '',
            km,
            fuelPercent: fuelPct,
            timestamp: r?.updatedAt || r?.completedAt || r?.endTime || r?.timestamp
          }
        : undefined,
      __server: r,
    };
  };

  /** Pending logs (requires userId in query) */
  const fetchPending = useCallback(async (token, userId) => {
    const url = `${PENDING_URL}?userId=${encodeURIComponent(userId)}&vehicle=&perPage=10&pageNo=1`;
    const res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });

    let data;
    try { data = await res.json(); } catch { data = { message: await res.text() }; }

    if (!res.ok) {
      if (res.status === 401) await AsyncStorage.multiRemove(['userToken', 'userData', 'userId']);
      throw new Error(data?.message || 'Failed to load pending travel logs.');
    }

    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(adaptServerRow);
  }, []);

  /** Completed logs (by token; no driverId in URL) */
  const fetchCompleted = useCallback(async (token) => {
    const res = await fetch(COMPLETED_BY_TOKEN_URL, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });

    let data;
    try { data = await res.json(); } catch { data = { message: await res.text() }; }

    if (!res.ok) {
      if (res.status === 401) await AsyncStorage.multiRemove(['userToken', 'userData', 'userId']);
      throw new Error(data?.message || 'Failed to load completed travel logs.');
    }

    // Accept both {data:[...]} and [...]
    const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    const normalized = rows.map(r => ({ status: 'completed', ...r }));
    return normalized.map(adaptServerRow);
  }, []);

  /** Load both lists */
  const loadBoth = useCallback(async () => {
    setError('');
    try {
      const { token, userId } = await getSession();
      const [p, c] = await Promise.allSettled([
        fetchPending(token, userId),
        fetchCompleted(token),
      ]);

      const pend = p.status === 'fulfilled' ? p.value : [];
      const comp = c.status === 'fulfilled' ? c.value : [];

      setPendingLogs(pend.sort((a, b) => (b?.meta?.timestamp || '').localeCompare(a?.meta?.timestamp || '')));
      setCompletedLogs(comp.sort((a, b) => (b?.meta?.timestamp || '').localeCompare(a?.meta?.timestamp || '')));
    } catch (e) {
      console.error('[TravelLogs] fetch error', e);
      setError(e?.message || 'Error loading logs.');
      setPendingLogs([]);
      setCompletedLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPending, fetchCompleted]);

  // Reload on screen focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setLoading(true);
      loadBoth();
    });
    return unsub;
  }, [navigation, loadBoth]);

  // Apply filter
  useEffect(() => {
    let list = [];
    if (filter === 'pending') list = pendingLogs;
    else if (filter === 'completed') list = completedLogs;
    else list = [...pendingLogs, ...completedLogs];

    setLogs(list.sort((a, b) => (b?.meta?.timestamp || '').localeCompare(a?.meta?.timestamp || '')));
  }, [filter, pendingLogs, completedLogs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBoth();
  }, [loadBoth]);

  const renderItem = ({ item }) => (
    <LogRow
      item={item}
      onPress={() => navigation.navigate('TravelLogComplete', { id: item.id, serverRecord: item.__server || null })}
    />
  );

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.header}>Travel Logs</Text>
            <Text style={styles.subHeader}>Pending + Completed (by token)</Text>
          </View>
          <View style={styles.headerDecoration} />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['all', 'pending', 'completed'].map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading logs…</Text>
        </View>
      ) : error ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 8 }}>{error}</Text>
          <TouchableOpacity onPress={loadBoth} style={{ backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>کوئی لاگ نہیں ملا۔</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        />
      )}
    </SafeAreaView>
  );
}

function LogRow({ item, onPress }) {
  const isCompleted = !!item?.post?.completed;
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!isCompleted) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isCompleted, pulse]);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Animated.View
        style={[
          styles.card,
          !isCompleted && { transform: [{ scale: pulse }] },
          isCompleted ? styles.cardDone : styles.cardPending,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
              {item.officer}
            </Text>
            <Text style={styles.cardRoute} numberOfLines={1} ellipsizeMode="tail">
              {item.from} → {item.to}
            </Text>
            <Text style={styles.cardMeta}>
              Pre: {item.preMeter} | {new Date(item?.meta?.timestamp || Date.now()).toLocaleString()}
            </Text>
            {isCompleted && (
              <Text style={styles.completedMeta}>
                Post: {item.post.postMeter} | KM: {item.post.km} | Fuel: {item.post.fuelPercent}%
              </Text>
            )}
          </View>
          <View style={[styles.badge, isCompleted ? styles.badgeDone : styles.badgePending]}>
            <Text style={styles.badgeText}>
              {isCompleted ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/** -------------------------- COMPLETE SCREEN -------------------------- */
function TravelLogComplete({ route, navigation }) {
  const { id, serverRecord } = route.params || {};
  const [record, setRecord] = useState(null);

  // new fields
  const [postMeter, setPostMeter] = useState('');
  const [postMeterImg, setPostMeterImg] = useState(null);
  const [fuelPercent, setFuelPercent] = useState(0);
  const [fuelMeterImg, setFuelMeterImg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // load current record
  useEffect(() => {
    (async () => {
      try {
        if (serverRecord) {
          const pre = Number(serverRecord.preMeter ?? serverRecord.pre_odometer ?? 0);
          const post = Number(serverRecord.postMeter ?? serverRecord.post_odometer ?? 0);
          const apiKm =
            (Number.isFinite(serverRecord.distanceKm) && serverRecord.distanceKm) ??
            (Number.isFinite(serverRecord.distanceKM) && serverRecord.distanceKM) ??
            (Number.isFinite(serverRecord.DistanceKM) && serverRecord.DistanceKM) ??
            (Number.isFinite(serverRecord.distance) && serverRecord.distance);
          const km = Number.isFinite(apiKm) ? apiKm : Math.max(0, (Number.isFinite(post) ? post : 0) - (Number.isFinite(pre) ? pre : 0));

          const fuelPct =
            typeof serverRecord.fuelPercent === 'number' ? serverRecord.fuelPercent :
            typeof serverRecord.fuel === 'number' ? serverRecord.fuel :
            0;

          setRecord({
            id: serverRecord._id,
            officer: serverRecord.officer || serverRecord.driverName || '',
            from: serverRecord.travelFrom || '',
            to: serverRecord.travelTo || '',
            preMeter: pre || '',
            preMeterImg: serverRecord.preMeterImg || serverRecord.preMeterImage || serverRecord.pre_odometer_image || null,
            raw: serverRecord,
            meta: { timestamp: serverRecord.timestamp || serverRecord.createdAt || serverRecord.startTime || new Date().toISOString() },
            post: (serverRecord.status || '').toLowerCase() === 'completed'
              ? {
                  completed: true,
                  postMeter: post || '',
                  km,
                  fuelPercent: fuelPct,
                  timestamp: serverRecord.updatedAt || serverRecord.completedAt || serverRecord.endTime || serverRecord.timestamp
                }
              : undefined,
          });
          return;
        }

        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const found = list.find((x) => x.id === id);
        setRecord(found || null);

        if (found?.post?.completed) {
          setPostMeter(String(found.post.postMeter || ''));
          setFuelPercent(found.post.fuelPercent ?? 0);
          setPostMeterImg({ uri: found.post.postMeterImg });
          setFuelMeterImg({ uri: found.post.fuelMeterImg });
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not load the selected log.');
        navigation.goBack();
      }
    })();
  }, [id, serverRecord, navigation]);

  const pre = useMemo(() => Number(record?.preMeter ?? 0), [record]);
  const postNum = useMemo(() => Number(postMeter || 0), [postMeter]);

  // Prefer API-provided distance for completed; fallback otherwise
  const km = useMemo(() => {
    if (record?.post?.completed) return record.post.km;
    return Math.max(0, (Number.isFinite(postNum) ? postNum : 0) - (Number.isFinite(pre) ? pre : 0));
  }, [postNum, pre, record]);

  const isCompleted = !!record?.post?.completed;
  const isFormValid =
    !isCompleted &&
    record &&
    Number.isFinite(postNum) &&
    postMeter !== '' &&
    postNum >= pre &&
    !!postMeterImg?.uri &&
    !!fuelMeterImg?.uri;

  // ---- permissions + location (best effort) ----
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          { title: 'Location Permission', message: 'Completing travel requires your location.', buttonNeutral: 'Ask Me Later', buttonNegative: 'Cancel', buttonPositive: 'OK' }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch { return false; }
    } else {
      try {
        const auth = await Geolocation.requestAuthorization?.('whenInUse');
        return auth === 'granted' || auth === 'authorized';
      } catch { return false; }
    }
  };

  const getCurrentLocation = async () => {
    const ok = await requestLocationPermission();
    if (!ok) return null;
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        pos => resolve([pos.coords.latitude, pos.coords.longitude]),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 8000 }
      );
    });
  };

  // ---- bucket image upload (RN: don't force multipart boundary) ----
  const uploadImageToBucket = async (imageObj) => {
    if (!imageObj?.uri) return null;
    const uri = imageObj.uri;

    if (/^https?:\/\//i.test(uri)) return uri; // already uploaded

    const name = uri.split('/').pop() || 'image.jpg';
    const extMatch = /\.(\w+)$/.exec(name);
    const type = extMatch ? `image/${extMatch[1]}` : 'image/jpeg';

    const fd = new FormData();
    fd.append('files', { uri, name, type });
    fd.append('uploadPath', 'DriverAPP');
    fd.append('isMulti', 'true');

    const res = await fetch(BUCKET_UPLOAD_URL, {
      method: 'POST',
      body: fd,
    });

    let data;
    try { data = await res.json(); }
    catch {
      const txt = await res.text();
      const urlMatch = txt.match(/https?:\/\/[^\s"'<>\\]+/i);
      if (res.ok && urlMatch) return urlMatch[0];
      throw new Error('Image upload failed');
    }

    if (!res.ok) throw new Error(data?.message || 'Image upload failed');

    const candidates = [];
    if (Array.isArray(data)) candidates.push(...data);
    else if (data?.data && Array.isArray(data.data)) candidates.push(...data.data);
    else if (data) candidates.push(data);

    for (const it of candidates) {
      if (typeof it === 'string' && /^https?:\/\//i.test(it)) return it;
      if (it?.availableSizes?.image) return it.availableSizes.image;
      if (it?.url) return it.url;
      if (it?.Location) return it.Location;
    }

    const flat = JSON.stringify(data);
    const anyUrl = flat.match(/https?:\/\/[^\s"'<>\\]+/i);
    if (anyUrl) return anyUrl[0];

    throw new Error('Image upload response did not include a URL');
  };

  // ---- PATCH /complete (hardened) ----
  const submitCompletion = async () => {
    if (!record) return;
    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('Auth token missing. Please login again.');

    // Validate again (defense)
    if (!Number.isFinite(postNum) || postNum < Number(record?.preMeter ?? 0)) {
      throw new Error('Post meter must be a valid number and >= Pre meter.');
    }
    if (!postMeterImg?.uri || !fuelMeterImg?.uri) {
      throw new Error('Both images are required.');
    }

    // Get GPS (optional)
    let coords = await getCurrentLocation();

    // Upload images
    const postMeterImgUrl = await uploadImageToBucket(postMeterImg);
    const fuelMeterImgUrl = await uploadImageToBucket(fuelMeterImg);

    // Build payload (include fallbacks for server field name variations)
    const payload = {
      postMeter: postNum,
      post_odometer: postNum,                        // fallback
      postMeterImg: postMeterImgUrl,
      postMeterImage: postMeterImgUrl,               // fallback
      fuelPercent,
      fuel: fuelPercent,                             // fallback
      fuelMeterImg: fuelMeterImgUrl,
      fuelMeterImage: fuelMeterImgUrl,               // fallback
      Coordinates: Array.isArray(coords) ? coords : undefined,
    };

    const url = `${COMPLETE_BASE_URL}/${record.id}/complete`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    let data;
    try { data = await res.json(); } catch { data = { message: await res.text() }; }

    if (!res.ok) {
      if (res.status === 401) {
        await AsyncStorage.multiRemove(['userToken', 'userData', 'userId']);
        throw new Error(data?.message || 'Session expired. Please login again.');
      }
      const msg = data?.errors?.map?.(e => e?.msg || e)?.join?.('\n') || data?.message || 'Failed to complete travel log.';
      throw new Error(msg);
    }

    return data;
  };

  const handleSave = useCallback(async () => {
    if (!record) return;
    if (!isFormValid) {
      Alert.alert('Missing/Invalid', 'براہِ کرم درست Post Meter اور دونوں تصاویر فراہم کریں۔');
      return;
    }

    try {
      setSubmitting(true);
      await submitCompletion();
      Alert.alert('Success', 'Travel marked as completed!');
      navigation.goBack();
    } catch (e) {
      console.error('[Complete PATCH] error:', e);
      Alert.alert('Error', String(e?.message || 'Could not complete the travel log.'));
    } finally {
      setSubmitting(false);
    }
  }, [record, isFormValid, submitCompletion, navigation]);

  // ⬇️ IMPORTANT FIX: call all hooks BEFORE any conditional returns
  const gallery = useMemo(() => collectAllImages(record), [record]);

  if (!record) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <View style={{ padding: 24 }}><Text>Loading…</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.header}>
              {isCompleted ? 'Travel Details' : 'Complete Travel'}
            </Text>
            <Text style={styles.subHeader}>
              {isCompleted ? 'View completed travel details' : 'Review previous info and submit post details'}
            </Text>
          </View>
          <View style={styles.headerDecoration} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Previous details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Travel Information</Text>
            <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusPending]}>
              <Text style={styles.statusBadgeText}>
                {isCompleted ? 'Completed' : 'Pending'}
              </Text>
            </View>
          </View>
          <ReadonlyRow label="Officer" value={record.officer} />
          <ReadonlyRow label="From" value={record.from} />
          <ReadonlyRow label="To" value={record.to} />
          <ReadonlyRow label="Pre Meter" value={String(record.preMeter)} />
          <ReadonlyRow label="Journey Started" value={new Date(record.meta.timestamp).toLocaleString()} />

          {isCompleted && (
            <>
              <ReadonlyRow label="Post Meter" value={String(record.post.postMeter)} />
              <ReadonlyRow label="Distance Traveled" value={`${record.post.km} km`} />
              <ReadonlyRow label="Fuel Status" value={`${record.post.fuelPercent}%`} />
              {record.post.timestamp && (
                <ReadonlyRow label="Journey Completed" value={new Date(record.post.timestamp).toLocaleString()} />
              )}
            </>
          )}
        </View>

        {/* Post Details (only pending) */}
        {!isCompleted && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Post Details</Text>

            <Text style={styles.inputLabel}>Post Meter Reading <Text style={{ color: '#ef4444' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={postMeter}
              onChangeText={(t) => setPostMeter(t.replace(/[^\d]/g, ''))}
              placeholder="Enter post meter value"
              keyboardType="number-pad"
              editable={!isCompleted && !submitting}
            />
            <Text style={styles.hint}>KM Travel (auto): <Text style={{ fontWeight: '700' }}>{km}</Text></Text>

            <View style={{ marginTop: 16 }}>
              <ImageCaptureRow
                label="Post Meter Image"
                value={postMeterImg}
                onChange={setPostMeterImg}
                disabled={isCompleted || submitting}
              />
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={styles.inputLabel}>Fuel Status (%)</Text>
              <Slider
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={fuelPercent}
                onValueChange={setFuelPercent}
                disabled={isCompleted || submitting}
                minimumTrackTintColor="#7c3aed"
                maximumTrackTintColor="#e5e7eb"
                thumbTintColor="#7c3aed"
              />
              <Text style={styles.hint}>Selected: {fuelPercent}%</Text>
            </View>

            <View style={{ marginTop: 16 }}>
              <ImageCaptureRow
                label="Fuel Meter Image"
                value={fuelMeterImg}
                onChange={setFuelMeterImg}
                disabled={isCompleted || submitting}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!isFormValid || submitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={!isFormValid || submitting}
            >
              {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Post Details</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ---- Attachments / All Images ---- */}
        {gallery.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            <ImageGrid images={gallery} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** ------------------------------ helpers ------------------------------ */
function ReadonlyRow({ label, value }) {
  return (
    <View style={styles.readonlyRow}>
      <Text style={styles.readonlyLabel}>{label}</Text>
      <Text style={styles.readonlyValue}>{value}</Text>
    </View>
  );
}

/** Collect & dedupe all possible image fields into [{url, label}] */
function collectAllImages(rec) {
  const raw = rec?.raw || {};
  const buckets = [];

  // single fields
  const single = [
    { key: 'preMeterImg', label: 'Pre Meter' },
    { key: 'preMeterImage', label: 'Pre Meter' },
    { key: 'pre_odometer_image', label: 'Pre Meter' },
    { key: 'postMeterImg', label: 'Post Meter' },
    { key: 'postMeterImage', label: 'Post Meter' },
    { key: 'post_odometer_image', label: 'Post Meter' },
    { key: 'fuelMeterImg', label: 'Fuel Meter' },
    { key: 'fuelMeterImage', label: 'Fuel Meter' },
  ];
  single.forEach(({ key, label }) => {
    const url = raw?.[key];
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      buckets.push({ url, label });
    }
  });

  // array-like fields
  const arrays = [
    { key: 'preImages', label: 'Pre' },
    { key: 'postImages', label: 'Post' },
    { key: 'fuelImages', label: 'Fuel' },
    { key: 'images', label: 'Image' },
    { key: 'attachments', label: 'Attachment' },
    { key: 'photos', label: 'Photo' },
  ];
  arrays.forEach(({ key, label }) => {
    const arr = raw?.[key];
    if (Array.isArray(arr)) {
      arr.forEach((u, idx) => {
        if (typeof u === 'string' && /^https?:\/\//i.test(u)) {
          buckets.push({ url: u, label: `${label} ${idx + 1}` });
        } else if (u && typeof u === 'object') {
          // try common shapes: {url}, {image}, {Location}, {availableSizes: {image}}
          const u1 = u.url || u.image || u.Location || u?.availableSizes?.image;
          if (typeof u1 === 'string' && /^https?:\/\//i.test(u1)) {
            buckets.push({ url: u1, label: `${label} ${idx + 1}` });
          }
        }
      });
    }
  });

  // dedupe by URL
  const seen = new Set();
  const deduped = [];
  for (const it of buckets) {
    if (!seen.has(it.url)) {
      seen.add(it.url);
      deduped.push(it);
    }
  }
  return deduped;
}

/** Simple responsive image grid */
function ImageGrid({ images }) {
  if (!Array.isArray(images) || images.length === 0) return null;
  return (
    <View style={styles.gridWrap}>
      {images.map((img, idx) => (
        <View key={`${img.url}-${idx}`} style={styles.gridItem}>
          <Image source={{ uri: img.url }} style={styles.gridImage} />
          {!!img.label && <Text style={styles.gridCaption} numberOfLines={1}>{img.label}</Text>}
        </View>
      ))}
    </View>
  );
}

/** ------------------------------- styles ------------------------------ */
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f8fafc', paddingBottom: 40 },

  // Header
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
    paddingBottom: 24,
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

  // Filter pills
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  filterPill: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  filterPillActive: { backgroundColor: '#fff' },
  filterText: { color: '#f3f4f6', fontWeight: '600' },
  filterTextActive: { color: '#7c3aed' },

  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardPending: { borderColor: '#fde68a', backgroundColor: '#fffbeb' },
  cardDone: { borderColor: '#e5e7eb', backgroundColor: '#ffffff' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardContent: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardRoute: { fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '500' },
  cardMeta: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  completedMeta: { fontSize: 12, color: '#10b981', fontWeight: '600', marginTop: 4 },

  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    minWidth: 70, alignItems: 'center', justifyContent: 'center',
  },
  badgePending: { backgroundColor: '#fcd34d' },
  badgeDone: { backgroundColor: '#a7f3d0' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#111827' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  statusPending: { backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusCompleted: { backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#374151' },

  readonlyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  readonlyLabel: { color: '#6b7280', fontSize: 14, fontWeight: '500' },
  readonlyValue: { color: '#111827', fontWeight: '600', fontSize: 14 },

  inputLabel: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937', backgroundColor: '#ffffff',
    fontWeight: '500',
  },
  hint: { color: '#6b7280', marginTop: 6 },

  imageSection: { marginBottom: 20 },
  imageLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#f3f4f6' },

  // gallery grid
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginHorizontal: -6 },
  gridItem: { width: '33.333%', paddingHorizontal: 6, marginBottom: 12 },
  gridImage: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: '#f3f4f6' },
  gridCaption: { marginTop: 6, fontSize: 12, color: '#6b7280', textAlign: 'center' },

  submitBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 20,
  },
  submitBtnDisabled: { backgroundColor: '#9ca3af', shadowColor: '#6b7280', shadowOpacity: 0.2, elevation: 4 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
