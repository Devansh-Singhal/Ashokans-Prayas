import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Building2,
  HelpCircle,
  Edit3,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CAPS_LABEL, NUMERIC, TYPOGRAPHY } from '../constants/typography';

const STANDARD_DEPARTMENTS = [
  'Public Works Department (Punjab PWD) - Arterial Road Division',
  'Ludhiana Municipal Corporation - Road Maintenance Division',
  'National Highways Authority of India (NHAI)',
  'Ludhiana Municipal Corporation Department of Environment Management Services (DEMS - Sanitation)',
  'Punjab Water Supply & Sewerage Board (PWSSB) / Municipal Drainage Division',
  'Electricity Distribution Utility (PSPCL / Municipal Electrical Division)',
  'Ludhiana Municipal Corporation Civil Engineering - Footpath & Pedestrian Division',
];

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
    url: 'https://images.unsplash.com/photo-1543518360-68b9612a7c8c?w=1000&q=80',
    category: 'STREETLIGHT',
  },
];

export const ReportScreen: React.FC = () => {
  const { currentUser, updatePoints } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoKind, setPhotoKind] = useState<'local' | 'remote' | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 30.8785,
    longitude: 75.8462,
  });
  const [locationLabel, setLocationLabel] = useState<string>('Ward 14 • Dugri–Gill Road, Ludhiana, Punjab');

  // AI Pre-Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // User confirmation and edit states
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [showDepartmentPicker, setShowDepartmentPicker] = useState<boolean>(false);

  // Publishing states
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filedInfo, setFiledInfo] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

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
        setLocationLabel('Demo location: Ward 14 • Dugri–Gill Road, Ludhiana, Punjab');
      }
    })();
  }, []);

  // Trigger AI analysis as soon as a photo is selected
  const analyzePhoto = async (uri: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    try {
      const ai = await api.analyzeTicketPhoto(uri);
      setAnalysisResult(ai);
      setSelectedDepartment(ai.target_department || STANDARD_DEPARTMENTS[0]);
      setCustomTitle(ai.suggested_title || 'Reported Civic Defect');
      setCustomDescription(ai.suggested_description || '');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Vision service unavailable') || msg.includes('503')) {
        setErrorMessage('DeepSeek vision service temporarily busy. You can still confirm details and publish.');
      } else {
        setErrorMessage(msg || 'AI analysis failed. You can manually enter details.');
      }
      // Fallback defaults
      setSelectedDepartment(STANDARD_DEPARTMENTS[0]);
      setCustomTitle('Civic Defect on Ward Corridor');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        setPhotoKind('local');
        await analyzePhoto(uri);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to open camera');
    }
  };

  const handleLaunchGallery = async () => {
    setErrorMessage(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        setPhotoKind('local');
        await analyzePhoto(uri);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to select from library');
    }
  };

  const handleSelectSample = async (sampleUrl: string) => {
    setErrorMessage(null);
    setPhotoUri(sampleUrl);
    setPhotoKind('remote');
    await analyzePhoto(sampleUrl);
  };

  const handleConfirmAndPublish = async () => {
    if (!photoUri) return;
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const res = await api.reportTicket(
        photoUri,
        coords.latitude,
        coords.longitude,
        'WARD_DELHI_14',
        currentUser.id,
        selectedDepartment,
        customTitle,
        customDescription
      );

      setIsSuccess(true);
      setFiledInfo(
        `${String(res.category || analysisResult?.category || 'DEFECT').replace(/_/g, ' ')} · ${selectedDepartment.split('-')[0]} · ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
      );
      updatePoints(res?.escrow_points ?? 50);

      timer.current = setTimeout(() => {
        setIsSuccess(false);
        setPhotoUri(null);
        setPhotoKind(null);
        setAnalysisResult(null);
        setFiledInfo(null);
      }, 5000);
    } catch (err: any) {
      const msg: string = err?.message || '';
      setIsSuccess(false);
      if (msg.startsWith('DUPLICATE:')) {
        setErrorMessage('Already mapped nearby. Check the feed for the existing ticket.');
      } else if (msg.includes('NEEDS_CLARIFICATION')) {
        setErrorMessage('AI could not classify with sufficient confidence — please retake with clearer framing.');
      } else {
        setErrorMessage(msg || 'Failed to publish report. Please try again.');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    setPhotoUri(null);
    setPhotoKind(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    setFiledInfo(null);
    setShowDepartmentPicker(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Report Civic Hazard</Text>
        <Text style={styles.subtitle}>
          DeepSeek 4.1 Vision analyzes the photograph, maps it to the exact responsible government department, and requires your confirmation before publishing.
        </Text>
      </View>

      {/* GPS Location Bar */}
      <View style={styles.locationBar}>
        <MapPin size={15} color="#0284C7" />
        <Text style={styles.locationText} numberOfLines={1}>
          {locationLabel}
        </Text>
      </View>

      {/* Photo Capture or Preview */}
      {photoUri ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.aiTag}>
            <Sparkles size={13} color="#38BDF8" />
            <Text style={styles.aiTagText}>
              {isAnalyzing
                ? 'DeepSeek vision analyzing image'
                : 'DeepSeek vision classification complete'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={handleReset}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Retake or clear photo"
          >
            <RotateCcw size={14} color="#0F172A" />
            <Text style={styles.retakeText}>Retake / Clear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.captureContainer}>
          <View style={styles.captureButtonsRow}>
            <TouchableOpacity
              style={styles.primaryCaptureBtn}
              onPress={handleLaunchCamera}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Take live photo"
              accessibilityHint="Opens the camera to capture civic evidence"
            >
              <Camera size={26} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Take Live Photo</Text>
              <Text style={styles.primaryBtnSub}>Live Device Viewfinder</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCaptureBtn}
              onPress={handleLaunchGallery}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Choose from gallery"
              accessibilityHint="Opens the photo library to select civic evidence"
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

      {/* AI Analyzing Loader */}
      {isAnalyzing && (
        <View style={styles.analyzingCard}>
          <ActivityIndicator color="#0284C7" size="small" />
          <Text style={styles.analyzingTitle}>Analyzing defect with DeepSeek vision</Text>
          <Text style={styles.analyzingSub}>
            Triaging municipal department, calculating severity, and verifying road jurisdiction.
          </Text>
        </View>
      )}

      {/* Explainable Department Routing & Confirmation Card */}
      {analysisResult && !isAnalyzing && (
        <View style={styles.routingReviewCard}>
          <View style={styles.reviewHeaderRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>
                {analysisResult.category} • SEVERITY {analysisResult.severity}/5
              </Text>
            </View>
            {analysisResult.is_submerged_or_wet && (
              <View style={styles.waterBadge}>
                <Text style={styles.waterText}>Monsoon Submerged</Text>
              </View>
            )}
          </View>

          {/* Government Department Box */}
          <View style={styles.departmentBox}>
            <View style={styles.deptHeaderRow}>
              <Building2 size={16} color="#0F172A" />
              <Text style={styles.deptLabel}>Assigned Government Authority</Text>
            </View>
            <Text style={styles.deptValue}>{selectedDepartment}</Text>

            {/* AI Reasoning Callout */}
            <View style={styles.reasoningCallout}>
              <View style={styles.reasoningTitleRow}>
                <HelpCircle size={13} color="#0D9488" />
                <Text style={styles.reasoningTitle}>Why the AI mapped to this department:</Text>
              </View>
              <Text style={styles.reasoningBody}>
                {analysisResult.department_reasoning ||
                  'Visual cues of road width, asphalt grade, and surrounding utility infrastructure match this authority.'}
              </Text>
            </View>

            {/* Department Override Toggle */}
            <TouchableOpacity
              style={styles.overrideToggle}
              onPress={() => setShowDepartmentPicker(!showDepartmentPicker)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={showDepartmentPicker ? 'Close department options' : 'Change department'}
              accessibilityState={{ expanded: showDepartmentPicker }}
            >
              <Edit3 size={13} color="#0284C7" />
              <Text style={styles.overrideToggleText}>
                {showDepartmentPicker ? 'Close Department Options' : 'Change department (wrong authority?)'}
              </Text>
              <ChevronDown size={14} color="#0284C7" />
            </TouchableOpacity>

            {/* Department Options Chips */}
            {showDepartmentPicker && (
              <View style={styles.deptList}>
                {STANDARD_DEPARTMENTS.map((dept, idx) => {
                  const isSelected = dept === selectedDepartment;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.deptChip, isSelected && styles.deptChipSelected]}
                      onPress={() => {
                        setSelectedDepartment(dept);
                        setShowDepartmentPicker(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={dept}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={[styles.deptChipText, isSelected && styles.deptChipTextSelected]}>
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Editable Post Content */}
          <View style={styles.editableSection}>
            <Text style={styles.editSectionLabel} nativeID="ticketTitleLabel">Ticket title</Text>
            <TextInput
              style={styles.textInput}
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="Concise defect title"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Ticket title"
              accessibilityLabelledBy="ticketTitleLabel"
            />

            <Text style={[styles.editSectionLabel, { marginTop: 10 }]} nativeID="ticketDescLabel">Description and field notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={customDescription}
              onChangeText={setCustomDescription}
              placeholder="Actionable notes for municipal inspection crew"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Description and field notes"
              accessibilityLabelledBy="ticketDescLabel"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Anti-Spoof Warning if triggered */}
          {analysisResult.is_screen_or_spoof && (
            <View style={styles.spoofWarning}>
              <ShieldAlert size={16} color="#D97706" />
              <Text style={styles.spoofText}>
                Notice: Image may resemble a digital monitor or print. Live on-street photos are required for full audit certification.
              </Text>
            </View>
          )}

          {/* Confirm & Publish Button */}
          <TouchableOpacity
            style={[styles.confirmPublishBtn, isPublishing && { opacity: 0.6 }]}
            onPress={handleConfirmAndPublish}
            disabled={isPublishing}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Confirm authority and publish report"
            accessibilityState={{ disabled: isPublishing, busy: isPublishing }}
          >
            {isPublishing ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#0B1B2F" size="small" />
                <Text style={styles.submitBtnText}>Publishing to Ward 14 Feed…</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>
                Confirm authority and publish (+50 escrow pts)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Success Notification */}
      {isSuccess && (
        <View style={styles.successBox}>
          <CheckCircle2 size={22} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Report Published to Ward 14 Feed</Text>
            <Text style={styles.successSub}>
              +50 Escrow Points Awarded. Routed to {selectedDepartment.split('-')[0]} for SLA tracking.
              {filedInfo ? `\n${filedInfo}` : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Civic Audit & Routing Standard</Text>
        <Text style={styles.infoCardText}>
          DeepSeek 4.1 Vision maps defects across Ludhiana Municipal Corporation, Punjab PWD, NHAI, PWSSB, and PSPCL jurisdictions. Your confirmation prevents inter-departmental blame games and ensures prompt field resolution.
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
    ...TYPOGRAPHY.h1,
    color: '#0F172A',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: '#64748B',
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
    ...TYPOGRAPHY.bodySmStrong,
    ...NUMERIC,
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
    ...TYPOGRAPHY.bodyStrong,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  primaryBtnSub: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#94A3B8',
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
    ...TYPOGRAPHY.bodyStrong,
    color: '#0F172A',
    marginTop: 8,
    textAlign: 'center',
  },
  secondaryBtnSub: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#64748B',
    marginTop: 2,
  },
  sampleSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sampleHeader: {
    ...TYPOGRAPHY.captionStrong,
    ...CAPS_LABEL,
    color: '#64748B',
    marginBottom: 8,
  },
  sampleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 44,
    justifyContent: 'center',
  },
  sampleChipText: {
    ...TYPOGRAPHY.captionStrong,
    color: '#334155',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#0F172A',
  },
  aiTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  aiTagText: {
    ...TYPOGRAPHY.captionStrong,
    color: '#F8FAFC',
  },
  retakeBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retakeText: {
    ...TYPOGRAPHY.captionStrong,
    color: '#0F172A',
  },
  analyzingCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  analyzingTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: '#0369A1',
    marginTop: 8,
  },
  analyzingSub: {
    ...TYPOGRAPHY.caption,
    color: '#0284C7',
    textAlign: 'center',
    marginTop: 4,
  },
  routingReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badgePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#FFFFFF',
  },
  waterBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  waterText: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#1D4ED8',
  },
  departmentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
  },
  deptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  deptLabel: {
    ...TYPOGRAPHY.captionStrong,
    ...CAPS_LABEL,
    color: '#64748B',
  },
  deptValue: {
    ...TYPOGRAPHY.subtitle,
    ...NUMERIC,
    color: '#0F172A',
    marginTop: 2,
  },
  reasoningCallout: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  reasoningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  reasoningTitle: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#0D9488',
  },
  reasoningBody: {
    ...TYPOGRAPHY.caption,
    color: '#334155',
  },
  overrideToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  overrideToggleText: {
    ...TYPOGRAPHY.captionStrong,
    color: '#0284C7',
    flex: 1,
  },
  deptList: {
    marginTop: 10,
    gap: 6,
  },
  deptChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  deptChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  deptChipText: {
    ...TYPOGRAPHY.captionStrong,
    color: '#334155',
  },
  deptChipTextSelected: {
    ...TYPOGRAPHY.captionStrong,
    color: '#FFFFFF',
  },
  editableSection: {
    marginBottom: 14,
  },
  editSectionLabel: {
    ...TYPOGRAPHY.captionStrong,
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    color: '#0F172A',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  spoofWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  spoofText: {
    ...TYPOGRAPHY.caption,
    color: '#92400E',
    flex: 1,
  },
  confirmPublishBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitBtnText: {
    ...TYPOGRAPHY.bodyStrong,
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmStrong,
    color: '#DC2626',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  successTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: '#065F46',
  },
  successSub: {
    ...TYPOGRAPHY.caption,
    color: '#047857',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCardTitle: {
    ...TYPOGRAPHY.captionStrong,
    ...CAPS_LABEL,
    color: '#64748B',
    marginBottom: 4,
  },
  infoCardText: {
    ...TYPOGRAPHY.caption,
    color: '#64748B',
  },
});
