import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Linking,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import ImageCaptureRow from '../components/ImageCaptureRow';
import Geolocation from '@react-native-community/geolocation';

const VEHICLES = ['SLJ-1112', 'SAJ-321', 'LEG-2106', 'GBF-848', 'Hiace APL-2025'];

const TRAVEL_API_URL = 'https://gis-lab-eco-tourism.vercel.app/fuel-app/api/travel/travel-logs';
const BUCKET_UPLOAD_URL = 'https://cms-dev.gisforestry.com/backend/upload/new';

export default function Traveling() {
  const [officer, setOfficer] = useState('');
  const [officerDesignation, setOfficerDesignation] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [preMeter, setPreMeter] = useState('');
  const [preMeterImg, setPreMeterImg] = useState(null);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  const [userToken, setUserToken] = useState(null);
  const [coordinates, setCoordinates] = useState(null); // [lat, lng]
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== bootstrap: token + location =====
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.log('Token read error:', e);
      }
    })();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Travel log بھیجنے کے لئے لوکیشن درکار ہے۔',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      try {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        return auth === 'granted' || auth === 'authorized';
      } catch {
        return false;
      }
    }
  };

  const getCurrentLocation = async () => {
    const hasPerm = await requestLocationPermission();
    if (!hasPerm) throw new Error('Location permission denied.');
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        pos => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setCoordinates(coords);
          resolve(coords);
        },
        err => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  useEffect(() => {
    (async () => {
      try { await getCurrentLocation(); } catch (e) { console.log('Location auto-get failed:', e?.message); }
    })();
  }, []);

  // ===== form logic =====
  const handlePreMeterChange = useCallback((t) => {
    const onlyDigits = t.replace(/[^\d]/g, '');
    setPreMeter(onlyDigits);
  }, []);

  const isFormValid = useMemo(() => {
    return (
      officer.trim().length > 0 &&
      officerDesignation.trim().length > 0 &&
      vehicle.trim().length > 0 &&
      preMeter.trim().length > 0 &&
      !!preMeterImg?.uri &&
      fromLocation.trim().length > 0 &&
      toLocation.trim().length > 0
    );
  }, [officer, officerDesignation, vehicle, preMeter, preMeterImg, fromLocation, toLocation]);

  const resetForm = useCallback(() => {
    setOfficer('');
    setOfficerDesignation('');
    setVehicle('');
    setPreMeter('');
    setPreMeterImg(null);
    setFromLocation('');
    setToLocation('');
    // keep coordinates
  }, []);

  // ===== image upload (files + uploadPath=DriverAPP + isMulti=true) =====
  const uploadImageToBucket = async (imageObj) => {
    if (!imageObj?.uri) return null;
    const uri = imageObj.uri;

    if (/^https?:\/\//i.test(uri)) return uri;

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
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    let data;
    try { data = await res.json(); }
    catch (e) {
      const txt = await res.text();
      const urlMatch = txt.match(/https?:\/\/[^\s"'<>]+/i);
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

  // ===== POST travel log (online DB only) =====
  const postTravelLog = async ({
    officer,
    officerDesignation,
    vehicle,
    preMeter,
    preMeterImgUrl,
    travelFrom,
    travelTo,
    coords,
  }) => {
    if (!userToken) {
      throw new Error('Authentication token missing. براہِ کرم دوبارہ لاگ اِن کریں۔');
    }
    const payload = {
      officer,
      officerDesignation,
      vehicle,
      preMeter,
      preMeterImg: preMeterImgUrl,
      travelFrom,
      travelTo,
      // Capitalized as per your schema example:
      Coordinates: Array.isArray(coords) && coords.length === 2 ? coords : undefined,
    };

    const res = await fetch(TRAVEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(payload),
    });

    let data;
    try { data = await res.json(); }
    catch { data = { message: await res.text() }; }

    if (!res.ok) {
      if (res.status === 401) {
        await AsyncStorage.multiRemove(['userToken', 'userData']);
        setUserToken(null);
        throw new Error(data?.message || 'Session expired. براہِ کرم دوبارہ لاگ اِن کریں۔');
      }
      throw new Error(data?.message || 'Failed to submit travel log.');
    }
    return data;
  };

  // ===== submit handler (no offline save) =====
  const handleSaveAndSubmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) {
      if (!isFormValid) Alert.alert('Missing Data', 'براہِ کرم تمام لازمی فیلڈز/تصاویر مکمل کریں۔');
      return;
    }

    const preMeterNum = Number(preMeter);
    if (!Number.isFinite(preMeterNum) || preMeterNum < 0) {
      Alert.alert('Invalid Value', 'Pre Meter ایک مثبت عدد ہونا چاہیے۔');
      return;
    }

    setIsSubmitting(true);
    try {
      // best-effort coordinates
      let coords = coordinates;
      if (!coords) { try { coords = await getCurrentLocation(); } catch {} }

      const preMeterImgUrl = await uploadImageToBucket(preMeterImg);

      await postTravelLog({
        officer: officer.trim(),
        officerDesignation: officerDesignation.trim(),
        vehicle: vehicle.trim(),
        preMeter: preMeterNum,
        preMeterImgUrl,
        travelFrom: fromLocation.trim(),
        travelTo: toLocation.trim(),
        coords,
      });

      Alert.alert('Success', 'سرور پر Travel Log کامیابی سے بھیج دیا گیا!');
      resetForm();
    } catch (e) {
      console.error('Submit error:', e);
      Alert.alert('Error', e?.message || 'Travel Log بھیجنے میں مسئلہ آیا۔');
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, isSubmitting, officer, officerDesignation, vehicle, preMeter, preMeterImg, fromLocation, toLocation, coordinates, userToken, resetForm]);

  // directions
  const openExternalMaps = useCallback(async () => {
    const from = fromLocation.trim();
    const to = toLocation.trim();
    if (!from || !to) {
      Alert.alert('Missing', 'براہِ کرم Start Travel From اور Travel To دونوں درج کریں۔');
      return;
    }
    const origin = encodeURIComponent(from);
    const dest = encodeURIComponent(to);

    const googleAppURL = `comgooglemaps://?saddr=${origin}&daddr=${dest}&directionsmode=driving`;
    const appleMapsURL = `maps://?saddr=${origin}&daddr=${dest}&dirflg=d`;
    const googleWebURL  = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;

    try {
      if (Platform.OS === 'ios') {
        const hasGoogle = await Linking.canOpenURL('comgooglemaps://');
        if (hasGoogle) await Linking.openURL(googleAppURL);
        else await Linking.openURL(appleMapsURL);
      } else {
        const hasGoogle = await Linking.canOpenURL('comgooglemaps://');
        if (hasGoogle) await Linking.openURL(googleAppURL);
        else await Linking.openURL(googleWebURL);
      }
    } catch (e) {
      console.error('Open maps error:', e);
      Alert.alert('Maps Error', 'Maps کھولنے میں مسئلہ آیا—براہِ کرم دوبارہ کوشش کریں۔');
    }
  }, [fromLocation, toLocation]);

  const canOpenDirections = fromLocation.trim().length > 0 && toLocation.trim().length > 0;

  // ===== UI =====
  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.header}>Travel Log</Text>
            <Text style={styles.subHeader}>اپنا سفر شروع کرنے سے پہلے تفصیل درج کریں</Text>
          </View>
          <View style={styles.headerDecoration} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>

            {/* Officer */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Officer Name</Text>
                <View className="requiredDot" style={styles.requiredDot} />
              </View>
              <TextInput
                style={styles.input}
                value={officer}
                onChangeText={setOfficer}
                placeholder="Enter officer name"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="next"
                editable={!isSubmitting}
              />
            </View>

            {/* Designation */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Officer Designation</Text>
                <View style={styles.requiredDot} />
              </View>
              <TextInput
                style={styles.input}
                value={officerDesignation}
                onChangeText={setOfficerDesignation}
                placeholder="e.g., Assistant Director"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="next"
                editable={!isSubmitting}
              />
            </View>

            {/* Vehicle */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Vehicle</Text>
                <View style={styles.requiredDot} />
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={vehicle}
                  onValueChange={setVehicle}
                  style={styles.picker}
                  dropdownIconColor="#7c3aed"
                  enabled={!isSubmitting}
                >
                  <Picker.Item label="Select vehicle" value="" />
                  {VEHICLES.map((v) => (
                    <Picker.Item key={v} label={v} value={v} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Pre Meter */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Meter Reading (Start of Journey)</Text>
                <View style={styles.requiredDot} />
              </View>
              <TextInput
                style={styles.input}
                value={preMeter}
                onChangeText={handlePreMeterChange}
                keyboardType="number-pad"
                placeholder="Enter pre meter value"
                placeholderTextColor="#9ca3af"
                maxLength={9}
                returnKeyType="done"
                editable={!isSubmitting}
              />
            </View>

            {/* Pre Meter Image */}
            <View style={styles.imagesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Required Image</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>1</Text>
                </View>
              </View>
              <View style={styles.imageCard}>
                <ImageCaptureRow
                  label="Meter Reading (Start of Journey) Image"
                  value={preMeterImg}
                  onChange={setPreMeterImg}
                  disabled={isSubmitting}
                />
              </View>
            </View>

            {/* From */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Start Travel From</Text>
                <View style={styles.requiredDot} />
              </View>
              <TextInput
                style={styles.input}
                value={fromLocation}
                onChangeText={setFromLocation}
                placeholder="e.g., GISLAB Lahore"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="next"
                editable={!isSubmitting}
              />
            </View>

            {/* To */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Travel To</Text>
                <View style={styles.requiredDot} />
              </View>
              <TextInput
                style={styles.input}
                value={toLocation}
                onChangeText={setToLocation}
                placeholder="e.g., Forest Service Academy, Murree"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="done"
                editable={!isSubmitting}
              />
            </View>

            {/* coordinates preview */}
            {Array.isArray(coordinates) && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#6b7280', marginBottom: 6 }}>
                  📍 Coordinates (auto): {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
                </Text>
              </View>
            )}

            {/* Open Maps */}
            <TouchableOpacity
              onPress={openExternalMaps}
              disabled={!canOpenDirections || isSubmitting}
              style={[
                styles.submitBtn,
                {
                  marginBottom: 12,
                  backgroundColor: (!canOpenDirections || isSubmitting) ? '#d1d5db' : '#10b981',
                },
              ]}
            >
              <View style={styles.submitBtnContent}>
                <Text style={styles.submitBtnText}>Open Directions in Maps</Text>
              </View>
            </TouchableOpacity>

            {/* Submit (online only) */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: '#0ea5e9' },
                (!isFormValid || isSubmitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSaveAndSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              <View style={styles.submitBtnContent}>
                {isSubmitting ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.submitBtnText, { marginLeft: 12 }]}>Submitting…</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Submit to Server</Text>
                    <View style={styles.submitBtnIcon}>
                      <Text style={styles.submitBtnIconText}>↗</Text>
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 40,
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
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subHeader: {
    fontSize: 16,
    color: '#e9d5ff',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  container: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 24,
    marginTop: -20,
  },
  inputContainer: {
    marginBottom: 28,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: -0.2,
  },
  requiredDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
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
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  picker: {
    color: '#1f2937',
    fontSize: 16,
  },
  imagesSection: {
    marginBottom: 32,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  imageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  submitBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    marginTop: 16,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitBtnDisabled: {
    backgroundColor: '#d1d5db',
    shadowColor: '#6b7280',
    shadowOpacity: 0.2,
    elevation: 4,
    borderColor: 'transparent',
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
    marginRight: 12,
  },
  submitBtnIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnIconText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
