import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import ImageCaptureRow from '../components/ImageCaptureRow';

const STORAGE_KEY = 'TRAVEL_LOGS';
const VEHICLES = ['SLJ-1112', 'SAJ-321', 'LEG-2106', 'GBF-848', 'Hiace APL-2025'];

export default function Traveling() {
  const [officer, setOfficer] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [preMeter, setPreMeter] = useState('');
  const [preMeterImg, setPreMeterImg] = useState(null);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  const handlePreMeterChange = useCallback((t) => {
    const onlyDigits = t.replace(/[^\d]/g, '');
    setPreMeter(onlyDigits);
  }, []);

  const isFormValid = useMemo(() => {
    return (
      officer.trim().length > 0 &&
      vehicle.trim().length > 0 &&
      preMeter.trim().length > 0 &&
      !!preMeterImg?.uri &&
      fromLocation.trim().length > 0 &&
      toLocation.trim().length > 0
    );
  }, [officer, vehicle, preMeter, preMeterImg, fromLocation, toLocation]);

  const resetForm = useCallback(() => {
    setOfficer('');
    setVehicle('');
    setPreMeter('');
    setPreMeterImg(null);
    setFromLocation('');
    setToLocation('');
  }, []);

  // save helper
  const saveToStorage = useCallback(async (record) => {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : [];
      parsed.push(record);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (err) {
      console.error('AsyncStorage error:', err);
      throw err;
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert('Missing Data', 'براہِ کرم تمام لازمی فیلڈز/تصاویر مکمل کریں۔');
      return;
    }

    const preMeterNum = Number(preMeter);
    if (!Number.isFinite(preMeterNum) || preMeterNum < 0) {
      Alert.alert('Invalid Value', 'Pre Meter ایک مثبت عدد ہونا چاہیے۔');
      return;
    }

    const record = {
      id: `travel_${Date.now()}`,
      officer: officer.trim(),
      vehicle: vehicle.trim(),
      preMeter: preMeterNum,
      preMeterImg: preMeterImg.uri,
      from: fromLocation.trim(),
      to: toLocation.trim(),
      meta: {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      await saveToStorage(record);
      Alert.alert('Saved', 'Travel ریکارڈ کامیابی سے محفوظ ہو گیا!');
      resetForm();
    } catch {
      Alert.alert('Error', 'ریکارڈ محفوظ کرنے میں مسئلہ آیا، دوبارہ کوشش کریں۔');
    }
  }, [isFormValid, officer, vehicle, preMeter, preMeterImg, fromLocation, toLocation, resetForm, saveToStorage]);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Header (as per your current Travel header spacing) */}
      <View style={styles.customHeader}>
        <View style={styles.headerBackground}>
          <Text style={styles.header}>Travel Log</Text>
          <Text style={styles.subHeader}>اپنا سفر شروع کرنے سے پہلے تفصیل درج کریں</Text>
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

            {/* Travel Officer */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Officer Name:</Text>
                <View style={styles.requiredDot} />
              </View>
              <TextInput
                style={styles.input}
                value={officer}
                onChangeText={setOfficer}
                placeholder="Enter officer name"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Vehicle Dropdown - NEW */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Vehicle</Text>
                <View style={styles.requiredDot} />
              </View>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={vehicle}
                  onValueChange={setVehicle}
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
                <Text style={styles.label}>Meter Reading Start of journey</Text>
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
              />
            </View>

            {/* Pre Meter Image */}
            <View style={styles.imagesSection}>
              <Text style={styles.sectionTitle}>Required Image</Text>
              <View style={styles.imageCard}>
                <ImageCaptureRow
                  label="Meter Reading Start of journey Image"
                  value={preMeterImg}
                  onChange={setPreMeterImg}
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
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={!isFormValid}
            >
              <Text style={styles.submitBtnText}>Save</Text>
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
  },
  customHeader: {
    backgroundColor: '#4f46e5',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerBackground: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: 30,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    color: '#e0e7ff',
    fontWeight: '500',
  },
  container: { flexGrow: 1 },
  formContainer: {
    padding: 20,
    marginTop: -10,
  },
  inputContainer: { marginBottom: 24 },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
  requiredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // Picker styled to match input (same as Fueling)
  pickerWrap: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imagesSection: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
    paddingLeft: 4,
  },
  imageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
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
    marginTop: 8,
    marginBottom: 20,
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: '#6b7280',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
