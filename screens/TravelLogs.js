import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  Platform, StatusBar, Animated, TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import ImageCaptureRow from '../components/ImageCaptureRow';

const STORAGE_KEY = 'TRAVEL_LOGS';
const Stack = createNativeStackNavigator();

/** ---------- Root wrapper with inner Stack (List -> Complete) ---------- */
export default function TravelLogs() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'default' : 'fade',
      }}
    >
      <Stack.Screen name="TravelLogsList" component={TravelLogsList} />
      <Stack.Screen name="TravelLogComplete" component={TravelLogComplete} />
    </Stack.Navigator>
  );
}

/** ---------------------------- LIST SCREEN ---------------------------- */
function TravelLogsList({ navigation }) {
  const [logs, setLogs] = useState([]);

  const loadLogs = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setLogs(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to load travel logs.');
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadLogs);
    return unsub;
  }, [navigation, loadLogs]);

  const renderItem = ({ item }) => <LogRow item={item} onPress={() => {
    navigation.navigate('TravelLogComplete', { id: item.id });
  }} />;

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Updated Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.header}>Travel Logs</Text>
            <Text style={styles.subHeader}>Tap a pending log to submit post details</Text>
          </View>
          <View style={styles.headerDecoration} />
        </View>
      </View>

      <FlatList
        data={logs.sort((a, b) => (b?.meta?.timestamp || '').localeCompare(a?.meta?.timestamp || ''))}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No travel logs saved yet.</Text>}
      />
    </SafeAreaView>
  );
}

function LogRow({ item, onPress }) {
  const isCompleted = !!item?.post?.completed;
  // pulse animation for pending rows
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
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={isCompleted}>
      <Animated.View
        style={[
          styles.card,
          !isCompleted && { transform: [{ scale: pulse }] },
          isCompleted ? styles.cardDone : styles.cardPending,
        ]}
      >
        {/* Improved layout with flex to handle long text */}
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
  const { id } = route.params || {};
  const [record, setRecord] = useState(null);

  // new fields
  const [postMeter, setPostMeter] = useState('');
  const [postMeterImg, setPostMeterImg] = useState(null);
  const [fuelPercent, setFuelPercent] = useState(0);
  const [fuelMeterImg, setFuelMeterImg] = useState(null);

  // load specific record by id
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const found = list.find((x) => x.id === id);
        setRecord(found || null);

        // if already completed, prefill readonly (and disable)
        if (found?.post?.completed) {
          setPostMeter(String(found.post.postMeter || ''));
          setFuelPercent(found.post.fuelPercent ?? 0);
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not load the selected log.');
        navigation.goBack();
      }
    })();
  }, [id, navigation]);

  const pre = useMemo(() => Number(record?.preMeter ?? 0), [record]);
  const postNum = useMemo(() => Number(postMeter || 0), [postMeter]);
  const km = useMemo(() => Math.max(0, (Number.isFinite(postNum) ? postNum : 0) - (Number.isFinite(pre) ? pre : 0)), [postNum, pre]);

  const isCompleted = !!record?.post?.completed;
  const isFormValid = !isCompleted && record && Number.isFinite(postNum) && postMeter !== '' && postNum >= pre
    && !!postMeterImg?.uri && !!fuelMeterImg?.uri;

  const handleSave = useCallback(async () => {
    if (!record) return;
    if (!isFormValid) {
      Alert.alert('Missing/Invalid', 'براہِ کرم درست Post Meter اور دونوں تصاویر فراہم کریں۔');
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((x) => x.id === record.id);
      if (idx < 0) throw new Error('Record not found');

      list[idx] = {
        ...list[idx],
        post: {
          completed: true,
          postMeter: postNum,
          postMeterImg: postMeterImg.uri,
          km,
          fuelPercent,
          fuelMeterImg: fuelMeterImg.uri,
          timestamp: new Date().toISOString(),
        },
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      Alert.alert('Success', 'Post-travel details saved.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save post details. Try again.');
    }
  }, [record, isFormValid, postNum, postMeterImg, km, fuelPercent, fuelMeterImg, navigation]);

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

      {/* Updated Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.header}>Complete Travel</Text>
            <Text style={styles.subHeader}>Review previous info and submit post details</Text>
          </View>
          <View style={styles.headerDecoration} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Previous details (readonly) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Previous (readonly)</Text>
          <ReadonlyRow label="Officer" value={record.officer} />
          <ReadonlyRow label="From" value={record.from} />
          <ReadonlyRow label="To" value={record.to} />
          <ReadonlyRow label="Pre Meter" value={String(record.preMeter)} />
          <ReadonlyRow label="Saved On" value={new Date(record.meta.timestamp).toLocaleString()} />
        </View>

        {/* New details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Post Details</Text>

          {/* Post Meter Reading */}
          <Text style={styles.inputLabel}>Post Meter Reading <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={postMeter}
            onChangeText={(t) => setPostMeter(t.replace(/[^\d]/g, ''))}
            placeholder="Enter post meter value"
            keyboardType="number-pad"
            editable={!isCompleted}
          />
          <Text style={styles.hint}>KM Travel (auto): <Text style={{ fontWeight: '700' }}>{km}</Text></Text>

          {/* Post Meter Image */}
          <View style={{ marginTop: 16 }}>
            <ImageCaptureRow
              label="Post Meter Image"
              value={postMeterImg}
              onChange={setPostMeterImg}
              disabled={isCompleted}
            />
          </View>

          {/* Fuel Status (percent slider) */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.inputLabel}>Fuel Status (%)</Text>
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={fuelPercent}
              onValueChange={setFuelPercent}
              disabled={isCompleted}
            />
            <Text style={styles.hint}>Selected: {fuelPercent}%</Text>
          </View>

          {/* Fuel Meter Image */}
          <View style={{ marginTop: 16 }}>
            <ImageCaptureRow
              label="Fuel Meter Image"
              value={fuelMeterImg}
              onChange={setFuelMeterImg}
              disabled={isCompleted}
            />
          </View>

          {/* Save button */}
          {!isCompleted && (
            <TouchableOpacity
              style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={!isFormValid}
            >
              <Text style={styles.submitBtnText}>Save Post Details</Text>
            </TouchableOpacity>
          )}
          {isCompleted && (
            <View style={[styles.submitBtn, styles.submitBtnDisabled]}>
              <Text style={styles.submitBtnText}>Already Completed</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** ------------------------------ helpers ------------------------------ */
function ReadonlyRow({ label, value }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: '#6b7280', fontSize: 12 }}>{label}</Text>
      <Text style={{ color: '#111827', fontWeight: '600', fontSize: 16 }}>{value}</Text>
    </View>
  );
}

/** ------------------------------- styles ------------------------------ */
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f8fafc' },

  // Updated Header Styles
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
  header: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subHeader: {
    fontSize: 16,
    color: '#e9d5ff',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    paddingBottom: 40,

  },
  cardPending: { borderColor: '#fde68a', backgroundColor: '#fffbeb' },
  cardDone: { borderColor: '#e5e7eb', backgroundColor: '#ffffff' },

  // Improved card layout
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
    marginRight: 12, // Space between content and badge
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardRoute: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardMeta: {
    fontSize: 12,
    color: '#6b7280',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70, // Fixed minimum width
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePending: { backgroundColor: '#fcd34d' },
  badgeDone: { backgroundColor: '#a7f3d0' },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 12 },

  inputLabel: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    fontWeight: '500',
  },
  hint: { color: '#6b7280', marginTop: 6 },

  submitBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 20,
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: '#6b7280',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});