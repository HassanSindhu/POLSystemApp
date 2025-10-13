import React, { useMemo, useState, useEffect } from 'react';
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
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageCaptureRow from '../components/ImageCaptureRow';

const { width } = Dimensions.get('window');
const VEHICLES = ['SLJ-1112', 'SAJ-321', 'LEG-2106', 'GBF-848', 'Hiace APL-2025'];

// API URLs
const UPLOAD_API_URL = 'https://cms-dev.gisforestry.com/backend/upload/new';
const FUEL_API_URL = 'https://gis-lab-eco-tourism.vercel.app/fuel-app/api/fuel/create-fuel-records';

export default function Fueling() {
  const [vehicle, setVehicle] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [preMeter, setPreMeter] = useState('');
  const [preMeterImg, setPreMeterImg] = useState(null);
  const [machineMeterImg, setMachineMeterImg] = useState(null);
  const [receiptImg, setReceiptImg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [userToken, setUserToken] = useState(null);

  // Get token on component mount
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setUserToken(token);
          console.log('Token retrieved successfully');
        } else {
          console.log('No token found');
          Alert.alert('Authentication Required', 'Please login again.');
          // You might want to navigate back to login here
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    };

    getToken();
  }, []);

  // LIVE total
  const totalAmount = useMemo(() => {
    const l = parseFloat(liters);
    const p = parseFloat(pricePerLiter);
    if (Number.isFinite(l) && Number.isFinite(p)) return +(l * p).toFixed(2);
    return null;
  }, [liters, pricePerLiter]);

  // Request location permission for Android
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to submit fuel records.',
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
    }
    return true; // iOS handles permissions differently
  };

  // Get current location using React Native Community Geolocation
  const getCurrentLocation = async () => {
    try {
      // Request permission first
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const coords = [
              position.coords.latitude,
              position.coords.longitude
            ];
            setCoordinates(coords);
            resolve(coords);
          },
          (error) => {
            let errorMessage = 'Unable to get current location. ';

            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Location permission denied. Please enable location services.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information is unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage += 'Location request timed out.';
                break;
              default:
                errorMessage += 'An unknown error occurred.';
                break;
            }

            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
          }
        );
      });
    } catch (error) {
      throw error;
    }
  };

  // Upload image to server
  const uploadImage = async (imageUri, imageType) => {
    try {
      const formData = new FormData();

      // Create file object - use 'image' as field name
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Append the file with proper field name 'image'
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      });

      // Add other required parameters
      formData.append('uploadPath', 'DriverAPP');
      formData.append('filename', 'dr'); // Fixed filename as per API
      formData.append('sizes', 'thumbnail'); // Required sizes parameter

      console.log('Uploading image with data:', {
        uri: imageUri,
        uploadPath: 'DriverAPP',
        filename: 'dr',
        sizes: 'thumbnail'
      });

      const response = await fetch(UPLOAD_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (response.ok && data.status && data.data && data.data.length > 0) {
        // Return the image URL from availableSizes
        return data.data[0].availableSizes.image; // Use the 'image' size URL
      } else {
        throw new Error(data.message || 'Image upload failed');
      }
    } catch (error) {
      console.error(`Error uploading ${imageType} image:`, error);
      throw error;
    }
  };

  // Upload all images and get their URLs
  const uploadAllImages = async () => {
    const uploadedImages = {};

    try {
      // Upload pre meter image
      if (preMeterImg?.uri) {
        console.log('Uploading pre meter image...');
        uploadedImages.preMeterImg = await uploadImage(preMeterImg.uri, 'preMeter');
        console.log('Pre meter image uploaded:', uploadedImages.preMeterImg);
      }

      // Upload machine meter image
      if (machineMeterImg?.uri) {
        console.log('Uploading machine meter image...');
        uploadedImages.machineMeterImg = await uploadImage(machineMeterImg.uri, 'machineMeter');
        console.log('Machine meter image uploaded:', uploadedImages.machineMeterImg);
      }

      // Upload receipt image
      if (receiptImg?.uri) {
        console.log('Uploading receipt image...');
        uploadedImages.receiptImg = await uploadImage(receiptImg.uri, 'receipt');
        console.log('Receipt image uploaded:', uploadedImages.receiptImg);
      }

      return uploadedImages;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload one or more images: ' + error.message);
    }
  };

  // In the submitFuelRecord function, update the token expiration handling:
  const submitFuelRecord = async (fuelData) => {
    try {
      if (!userToken) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('Submitting fuel record to API with token:', userToken);

      const response = await fetch(FUEL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(fuelData),
      });

      const data = await response.json();
      console.log('Fuel record submission response:', data);

      if (response.ok) {
        return data;
      } else {
        // Handle token expiration or invalid token
        if (response.status === 401) {
          // Token is invalid or expired
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          setUserToken(null);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || 'Failed to submit fuel record');
      }
    } catch (error) {
      console.error('Error submitting fuel record:', error);
      throw error;
    }
  };

  // Add this function to handle token refresh if needed in the future
  const refreshToken = async () => {
    // You can implement token refresh logic here if your API supports it
    // For now, we'll just clear the token and ask user to login again
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    setUserToken(null);
    throw new Error('Session expired. Please login again.');
  };

  const handleSubmit = async () => {
    // Check if token exists
    if (!userToken) {
      Alert.alert('Authentication Required', 'Please login again to submit fuel records.');
      return;
    }

    // Validation
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

    setIsLoading(true);

    try {
      // Step 1: Get current location
      Alert.alert('Location', 'Please allow location access to submit fuel record.');
      const locationCoords = await getCurrentLocation();

      if (!locationCoords) {
        setIsLoading(false);
        return;
      }

      // Step 2: Upload all images
      Alert.alert('Uploading', 'Please wait while we upload your images...');
      const uploadedImages = await uploadAllImages();

      // Step 3: Prepare fuel record data
      const fuelRecordData = {
        vehicle: vehicle,
        liters: litersNum,
        pricePerLiter: priceNum,
        totalAmount: totalAmount ?? +(litersNum * priceNum).toFixed(2),
        preMeter: `${preMeter.trim()} km`,
        timestamp: new Date().toISOString(),
        images: uploadedImages,
        Coordinates: locationCoords,
      };

      console.log('Final fuel record data:', fuelRecordData);

      // Step 4: Submit fuel record
      Alert.alert('Submitting', 'Please wait while we save your fuel record...');
      await submitFuelRecord(fuelRecordData);

      // Success
      Alert.alert('Success', 'Fuel record submitted successfully!');

      // Clear form
      setVehicle('');
      setLiters('');
      setPricePerLiter('');
      setPreMeter('');
      setPreMeterImg(null);
      setMachineMeterImg(null);
      setReceiptImg(null);
      setCoordinates(null);

    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit fuel record. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled =
    !vehicle ||
    !liters.trim() ||
    !pricePerLiter.trim() ||
    !preMeter ||
    !preMeterImg ||
    !machineMeterImg ||
    !receiptImg ||
    isLoading ||
    !userToken;

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
          {/* Authentication Status */}
          {!userToken && (
            <View style={styles.authWarning}>
              <Text style={styles.authWarningText}>
                🔐 Authentication required. Please check your login status.
              </Text>
            </View>
          )}

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
                enabled={!isLoading && !!userToken}
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
              style={[styles.input, (isLoading || !userToken) && styles.inputDisabled]}
              value={liters}
              onChangeText={setLiters}
              keyboardType="decimal-pad"
              placeholder="Enter liters e.g., 45.5"
              placeholderTextColor="#9ca3af"
              editable={!isLoading && !!userToken}
            />
          </View>

          {/* Price (Per Liter) */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Price (Per Liter)</Text>
              <View style={styles.requiredDot} />
            </View>
            <TextInput
              style={[styles.input, (isLoading || !userToken) && styles.inputDisabled]}
              value={pricePerLiter}
              onChangeText={setPricePerLiter}
              keyboardType="decimal-pad"
              placeholder="Enter price per liter e.g., 285"
              placeholderTextColor="#9ca3af"
              editable={!isLoading && !!userToken}
            />
          </View>

          {/* Total (auto) */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Total Amount</Text>
            </View>
            <View style={[
              styles.readonlyBox,
              totalAmount && styles.readonlyBoxActive,
              (isLoading || !userToken) && styles.inputDisabled
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
              style={[styles.input, (isLoading || !userToken) && styles.inputDisabled]}
              value={preMeter}
              onChangeText={setPreMeter}
              keyboardType="numeric"
              placeholder="Enter pre meter value"
              placeholderTextColor="#9ca3af"
              editable={!isLoading && !!userToken}
            />
          </View>

          {/* Location Info */}
          {coordinates && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 Location Captured: {coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}
              </Text>
            </View>
          )}

          {/* Location Permission Note */}
          <View style={styles.locationNote}>
            <Text style={styles.locationNoteText}>
              📍 Note: Location access is required to submit fuel records. Please allow location permissions when prompted.
            </Text>
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
                disabled={isLoading || !userToken}
              />
            </View>

            <View style={styles.imageCard}>
              <ImageCaptureRow
                label="Fueling Machine Meter"
                value={machineMeterImg}
                onChange={setMachineMeterImg}
                disabled={isLoading || !userToken}
              />
            </View>

            <View style={styles.imageCard}>
              <ImageCaptureRow
                label="Receipt Image"
                value={receiptImg}
                onChange={setReceiptImg}
                disabled={isLoading || !userToken}
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
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Submit Fuel Record</Text>
                  <View style={styles.submitBtnIcon}>
                    <Text style={styles.submitBtnIconText}>→</Text>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={styles.loadingText}>Submitting fuel record...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ... (keep all your existing styles exactly the same)
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
  inputDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    color: '#6b7280',
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
  locationInfo: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 16,
  },
  locationText: {
    color: '#0369a1',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationNote: {
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 20,
  },
  locationNoteText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
  loadingOverlay: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
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
  authWarning: {
      backgroundColor: '#fef2f2',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#fecaca',
      marginBottom: 20,
    },
    authWarningText: {
      color: '#dc2626',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
});