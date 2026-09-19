import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera } from 'lucide-react-native';

import { COLORS } from '@/constants/colors';

export default function CameraScreen() {
  const handleTakePicture = () => {
    // Camera functionality would be implemented here
    alert('Camera capture initiated');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Camera</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.cameraPreview}>
          <Camera size={64} color={COLORS.orange} />
          <Text style={styles.placeholderText}>Camera Preview</Text>
          <Text style={styles.placeholderSubtext}>
            Grant camera permissions to capture photos
          </Text>
        </View>

        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePicture}
            activeOpacity={0.8}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <Text style={styles.controlsLabel}>Tap to take photo</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.headerDark,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.contentDark,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 24,
  },
  cameraPreview: {
    backgroundColor: COLORS.contentDark,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.orange,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.orange,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  controlsSection: {
    alignItems: 'center',
    gap: 12,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.contentDark,
    borderWidth: 3,
    borderColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.orange,
  },
  controlsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.orange,
  },
  actionButton: {
    backgroundColor: COLORS.contentDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '500',
  },
});
