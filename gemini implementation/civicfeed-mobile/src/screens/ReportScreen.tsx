import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Camera, MapPin, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ReportScreen: React.FC = () => {
  const { currentUser, updatePoints } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const samplePhoto = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80';

  const handleCapture = () => {
    setPhotoUri(samplePhoto);
  };

  const handleSubmit = async () => {
    if (!photoUri) return;
    setIsAnalyzing(true);

    try {
      // Simulate DeepSeek 4.1 Flash multi-modal classification
      await api.reportTicket(
        photoUri,
        28.6289 + (Math.random() - 0.5) * 0.005,
        77.2065 + (Math.random() - 0.5) * 0.005,
        'WARD_DELHI_14',
        currentUser.id
      );
      setIsSuccess(true);
      updatePoints(50);
      setTimeout(() => {
        setIsSuccess(false);
        setPhotoUri(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Report failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Civic Hazard</Text>
      <Text style={styles.subtitle}>
        Photo must be captured live. DeepSeek 4.1 Flash auto-classifies category & severity.
      </Text>

      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.aiTag}>
            <Sparkles size={14} color="#38BDF8" />
            <Text style={styles.aiTagText}>DeepSeek 4.1 Flash Vision Ready</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.captureBox} onPress={handleCapture}>
          <Camera size={44} color="#64748B" />
          <Text style={styles.captureText}>Tap to Capture Live Photo</Text>
          <Text style={styles.captureSub}>GPS will automatically be attached</Text>
        </TouchableOpacity>
      )}

      {isSuccess ? (
        <View style={styles.successBox}>
          <CheckCircle2 size={24} color="#16A34A" />
          <Text style={styles.successText}>Report Published to Ward 14 Feed! (+50 pts)</Text>
        </View>
      ) : (
        photoUri && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Publish to Public Ward Feed</Text>
            )}
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 16,
  },
  captureBox: {
    width: '100%',
    height: 260,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  captureText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  captureSub: {
    marginTop: 4,
    fontSize: 11,
    color: '#94A3B8',
  },
  previewContainer: {
    width: '100%',
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  aiTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  aiTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#0F172A',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
});
