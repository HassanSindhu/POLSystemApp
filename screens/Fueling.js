import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ImageCaptureRow from '../components/ImageCaptureRow';

const { width } = Dimensions.get('window');
const VEHICLES = ['SLJ-1112', 'SAJ-321', 'LEG-2106', 'GBF-848', 'Hiace APL-2025'];

export default function Fueling() {
  const [vehicle, setVehicle] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [preMeter, setPreMeter] = useState('');
  const [preMeterImg, setPreMeterImg] = useState(null);
  const [machineMeterImg, setMachineMeterImg] = useState(null);
  const [receiptImg, setReceiptImg] = useState(null);

  // LIVE total
  const totalAmount = useMemo(() => {
    const l = parseFloat(liters);
    const p = parseFloat(pricePerLiter);
    if (Number.isFinite(l) && Number.isFinite(p)) return +(l * p).toFixed(2);
    return null;
  }, [liters, pricePerLiter]);

  const handleSubmit = () => {
    if (!vehicle) {
      Alert.alert('Missing Field', 'Please select a Vehicle.');
      return;
    }
    if (!liters.trim()) {
      Alert.alert('Missing Field', 'Please enter Number of Liters.');
      return;
    }
    if (!pricePerLiter.trim()) {
      Alert.alert('Missing Field', 'Please enter Price (Per Liter).');
      return;
    }
    const litersNum = Number(liters);
    const priceNum = Number(pricePerLiter);
    if (!Number.isFinite(litersNum) || litersNum <= 0) {
      Alert.alert('Invalid Value', 'Number of Liters must be a positive number.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Value', 'Price (Per Liter) must be a positive number.');
      return;
    }
    if (!preMeter.trim()) {
      Alert.alert('Missing Field', 'Please enter Pre Meter value.');
      return;
    }
    if (!preMeterImg?.uri) {
      Alert.alert('Missing Image', 'Please capture the Pre Meter Image.');
      return;
    }
    if (!machineMeterImg?.uri) {
      Alert.alert('Missing Image', 'Please capture the Fueling Machine Meter image.');
      return;
    }
    if (!receiptImg?.uri) {
      Alert.alert('Missing Image', 'Please capture the Receipt image.');
      return;
    }

    const payload = {
      vehicle,
      liters: litersNum,
      pricePerLiter: priceNum,
      totalAmount: totalAmount ?? +(litersNum * priceNum).toFixed(2), // safety
      preMeter: preMeter.trim(),
      images: {
        preMeterImg: preMeterImg.uri,
        machineMeterImg: machineMeterImg.uri,
        receiptImg: receiptImg.uri,
      },
      meta: {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('Fuel submission:', payload);
    Alert.alert('Success', 'Fuel record submitted successfully!');

    // Clear form
    setVehicle('');
    setLiters('');
    setPricePerLiter('');
    setPreMeter('');
    setPreMeterImg(null);
    setMachineMeterImg(null);
    setReceiptImg(null);
  };

  const isDisabled =
    !vehicle ||
    !liters.trim() ||
    !pricePerLiter.trim() ||
    !preMeter ||
    !preMeterImg ||
    !machineMeterImg ||
    !receiptImg;

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <View style={styles.headerBackground}>
          <Text style={styles.header}>Fuel Tracking</Text>
          <Text style={styles.subHeader}>Record your fueling details</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Vehicle Dropdown */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Vehicle</Text>
              <View style={styles.requiredDot} />
            </View>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={vehicle} onValueChange={setVehicle}>
                <Picker.Item label="Select vehicle" value="" />
                {VEHICLES.map((v) => (
                  <Picker.Item key={v} label={v} value={v} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Number of Liters */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Number of Liters</Text>
              <View style={styles.requiredDot} />
            </View>
            <TextInput
              style={styles.input}
              value={liters}
              onChangeText={setLiters}
              keyboardType="decimal-pad"
              placeholder="Enter liters e.g., 45.5"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Price (Per Liter) */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Price (Per Liter)</Text>
              <View style={styles.requiredDot} />
            </View>
            <TextInput
              style={styles.input}
              value={pricePerLiter}
              onChangeText={setPricePerLiter}
              keyboardType="decimal-pad"
              placeholder="Enter price per liter e.g., 285"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Total (auto) */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Total Amount</Text>
            </View>
            <View style={styles.readonlyBox}>
              <Text style={styles.readonlyText}>
                {totalAmount !== null ? `Rs ${totalAmount}` : '—'}
              </Text>
            </View>
            <Text style={styles.hint}>Calculated as: liters × price per liter</Text>
          </View>

          {/* Pre Meter Input */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Pre Meter Reading</Text>
              <View style={styles.requiredDot} />
            </View>
            <TextInput
              style={styles.input}
              value={preMeter}
              onChangeText={setPreMeter}
              keyboardType="numeric"
              placeholder="Enter pre meter value"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Image Capture Sections */}
          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>Required Images</Text>

            <View style={styles.imageCard}>
              <ImageCaptureRow
                label="Pre Meter Image"
                value={preMeterImg}
                onChange={setPreMeterImg}
              />
            </View>

            <View style={styles.imageCard}>
              <ImageCaptureRow
                label="Fueling Machine Meter"
                value={machineMeterImg}
                onChange={setMachineMeterImg}
              />
            </View>

            <View style={styles.imageCard}>
              <ImageCaptureRow
                label="Receipt Image"
                value={receiptImg}
                onChange={setReceiptImg}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isDisabled && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isDisabled}
          >
            <Text style={styles.submitBtnText}>Submit Fuel Record</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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

  // Readonly total box
  readonlyBox: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f9fafb',
  },
  readonlyText: { color: '#1f2937', fontWeight: '700', fontSize: 16 },
  hint: { color: '#6b7280', marginTop: 6 },
});
