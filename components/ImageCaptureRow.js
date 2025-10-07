// components/ImageCaptureRow.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { launchCamera } from 'react-native-image-picker';

async function takePhoto() {
  try {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: false,
      includeBase64: false,
    });

    if (result.didCancel) return null;

    if (result.errorCode) {
      Alert.alert('Camera Error', result.errorMessage || result.errorCode);
      return null;
    }

    const asset = result.assets && result.assets[0] ? result.assets[0] : null;
    return asset;
  } catch (e) {
    Alert.alert('Camera Error', e?.message || 'Unknown error');
    return null;
  }
}

export default function ImageCaptureRow({ label, value, onChange }) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          style={styles.captureBtn}
          onPress={async () => {
            const asset = await takePhoto();
            if (asset) onChange(asset);
          }}
        >
          <Text style={styles.captureBtnText}>Capture</Text>
        </TouchableOpacity>

        {value?.uri ? (
          <Image source={{ uri: value.uri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={[styles.preview, styles.previewPlaceholder]}>
            <Text style={{ color: '#888' }}>No image</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 16 },
  label: { color: '#111', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  captureBtn: { backgroundColor: '#0a7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  captureBtnText: { color: '#fff', fontWeight: '700' },
  preview: { width: 90, height: 90, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  previewPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' },
});
