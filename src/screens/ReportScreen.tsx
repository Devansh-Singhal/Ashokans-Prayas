import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Camera, Image as ImageIcon, MapPin, Sparkles, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CURATED_DEMO_SAMPLES = [
  {
    label: 'Deep Asphalt Pothole',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=1000&q=80',
    category: 'POTHOLE',
  },
  {
    label: 'Overflowing Waste Bin',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=1000&q=80',
    category: 'GARBAGE_ACCUMULATION',
  },
  {
    label: 'Damaged Sodium Streetlight',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=1000&q=80',
    category: 'STREETLIGHT',
  },
];

export const ReportScreen: React.FC = () => {
  const { currentUser, updatePoints } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 28.6289,
    longitude: 77.2065,
  });
  const [locationLabel, setLocationLabel] = useState<string>('Ward 14 • Connaught Place, New Delhi');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          setLocationLabel(
            `GPS: ${loc.coords.latitude.toFixed(4)}° N, ${loc.coords.longitude.toFixed(4)}° E`
          );
        }
      } catch {
        // Fallback default coordinates
      }
    })();
  }, []);

  const handleLaunchCamera = async () => {
    setErrorMessage(null);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Access', 'Camera permission is required to capture live civic evidence.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to open camera');
    }
  };

  const handleLaunchGallery = async () => {
    setErrorMessage(null);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Gallery Access', 'Media library permission is required to select photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to select from library');
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setErrorMessage(null);
    setPhotoUri(sampleUrl);
  };

  const handleSubmit = async () => {
    if (!photoUri) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      await api.reportTicket(
        photoUri,
        coords.latitude + (Math.random() - 0.5) * 0.002,
        coords.longitude + (Math.random() - 0.5) * 0.002,
        'WARD_DELHI_14',
        currentUser.id
      );
      setIsSuccess(true);
      updatePoints(50);
      setTimeout(() => {
        setIsSuccess(false);
        setPhotoUri(null);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish report. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Report Road Hazard</Text>
        <Text style={styles.subtitle}>
          Capture photographic proof of potholes, garbage blackspots, or broken streetlights. Evidence is classified in real-time by DeepSeek 4.1 Vision.
        </Text>
      </View>

      {/* GPS Location Banner */}
      <View style={styles.locationBar}>
        <MapPin size={15} color="#0284C7" />
        <Text style={styles.locationText} numberOfLines={1}>
          {locationLabel}
        </Text>
      </View>

      {/* Photo Picker Viewport */}
      {photoUri ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.aiTag}>
            <Sparkles size={13} color="#38BDF8" />
            <Text style={styles.aiTagText}>DeepSeek 4.1 Vision Multi-Modal Ready</Text>
          </View>
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={() => setPhotoUri(null)}
            activeOpacity={0.8}
          >
            <RotateCcw size={14} color="#0F172A" />
            <Text style={styles.retakeText}>Retake / Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.captureContainer}>
          <View style={styles.captureButtonsRow}>
            <TouchableOpacity
              style={styles.primaryCaptureBtn}
              onPress={handleLaunchCamera}
              activeOpacity={0.8}
            >
              <Camera size={26} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Take Live Photo</Text>
              <Text style={styles.primaryBtnSub}>Opens Device Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCaptureBtn}
              onPress={handleLaunchGallery}
              activeOpacity={0.8}
            >
              <ImageIcon size={26} color="#0F172A" />
              <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
              <Text style={styles.secondaryBtnSub}>Photo Library</Text>
            </TouchableOpacity>
          </View>

          {/* Curated Demo Chips */}
          <View style={styles.sampleSection}>
            <Text style={styles.sampleHeader}>Quick Test Scenarios</Text>
            <View style={styles.sampleChipsRow}>
              {CURATED_DEMO_SAMPLES.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.sampleChip}
                  onPress={() => handleSelectSample(s.url)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sampleChipText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color="#DC2626" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Submit / Status Box */}
      {isSuccess ? (
        <View style={styles.successBox}>
          <CheckCircle2 size={22} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Report Published to Ward 14 Feed</Text>
            <Text style={styles.successSub}>
              +50 Escrow Points Awarded. Defect is now publicly visible for neighborhood endorsement.
            </Text>
          </View>
        </View>
      ) : (
        photoUri && (
          <TouchableOpacity
            style={[styles.submitBtn, isAnalyzing && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isAnalyzing}
            activeOpacity={0.85}
          >
            {isAnalyzing ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitBtnText}>Analyzing with DeepSeek 4.1 Vision...</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Publish to Ward 14 Feed (+50 Escrow Pts)</Text>
            )}
          </TouchableOpacity>
        )
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Civic Audit Standards</Text>
        <Text style={styles.infoCardText}>
          All submitted photographs must clearly show the defect and surrounding road context. Submissions within 50 meters of an existing active defect are automatically deduplicated.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 130,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
    flex: 1,
  },
  captureContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  captureButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryCaptureBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  primaryBtnSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  secondaryCaptureBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 120,
  },
  secondaryBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  secondaryBtnSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  sampleSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sampleHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sampleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 240,
  },
  aiTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  aiTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  retakeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retakeText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#64748B',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  successTitle: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '800',
  },
  successSub: {
    color: '#047857',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  infoCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
