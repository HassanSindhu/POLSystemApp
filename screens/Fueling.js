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
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Enhanced Header with Gradient */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.header}>Fuel Tracking</Text>
            <Text style={styles.subHeader}>Record your fueling details</Text>
          </View>
          <View style={styles.headerDecoration} />
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
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={vehicle}
                onValueChange={setVehicle}
                style={styles.picker}
                dropdownIconColor="#7c3aed"
              >
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
            <View style={[
              styles.readonlyBox,
              totalAmount && styles.readonlyBoxActive
            ]}>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Required Images</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>3</Text>
              </View>
            </View>

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

          {/* Enhanced Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isDisabled && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isDisabled}
          >
            <View style={styles.submitBtnContent}>
              <Text style={styles.submitBtnText}>Submit Fuel Record</Text>
              <View style={styles.submitBtnIcon}>
                <Text style={styles.submitBtnIconText}>→</Text>
              </View>
            </View>
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

  // Readonly total box
  readonlyBox: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  readonlyBoxActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf5ff',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.1,
  },
  readonlyText: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  hint: {
    color: '#6b7280',
    marginTop: 8,
    fontSize: 13,
    fontStyle: 'italic',
  },
});