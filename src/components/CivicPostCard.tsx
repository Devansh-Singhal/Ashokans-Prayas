import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
  Modal,
} from 'react-native';
import {
  MapPin,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Info,
  X,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react-native';
import { Ticket, TicketCategory } from '../types';
import { SeverityMeter } from './SeverityMeter';
import { StatusBadge } from './StatusBadge';
import { BeforeAfterView } from './BeforeAfterView';
import { GeofencePill } from './GeofencePill';
import { calculateHaversineDistance } from '../services/location';
import {
  ImpactFlameIcon,
  MonsoonPauseIcon,
  PotholeDefectIcon,
  WasteAccumulationIcon,
  StreetlightDefectIcon,
  OpenDrainHazardIcon,
} from './CivicIcons';

interface Props {
  ticket: Ticket;
  currentUserId: string;
  userCoords: { latitude: number; longitude: number };
  onEndorse: (ticketId: string) => Promise<void>;
  onVerifyPress: (ticket: Ticket) => void;
}

export const CivicPostCard: React.FC<Props> = ({
  ticket,
  currentUserId,
  userCoords,
  onEndorse,
  onVerifyPress,
}) => {
  const [upvotes, setUpvotes] = useState(ticket.upvotes);
  const [hasEndorsed, setHasEndorsed] = useState(false);
  const [isEndorsing, setIsEndorsing] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  const distance = calculateHaversineDistance(
    userCoords.latitude,
    userCoords.longitude,
    ticket.latitude,
    ticket.longitude
  );

  const getCategoryIcon = (cat: TicketCategory) => {
    switch (cat) {
      case 'POTHOLE':
        return <PotholeDefectIcon size={16} color="#EF4444" />;
      case 'GARBAGE_ACCUMULATION':
        return <WasteAccumulationIcon size={16} color="#F59E0B" />;
      case 'STREETLIGHT':
        return <StreetlightDefectIcon size={16} color="#EAB308" />;
      case 'OPEN_DRAIN':
        return <OpenDrainHazardIcon size={16} color="#0284C7" />;
      default:
        return <MapPin size={16} color="#64748B" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const handleEndorse = async () => {
    if (hasEndorsed || isEndorsing) return;
    setIsEndorsing(true);
    setUpvotes((prev) => prev + 1);
    setHasEndorsed(true);
    setShowBonus(true);
    setTimeout(() => setShowBonus(false), 2200);

    try {
      await onEndorse(ticket.id);
    } catch (err) {
      setUpvotes((prev) => prev - 1);
      setHasEndorsed(false);
    } finally {
      setIsEndorsing(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `[CivicFeed Alert] ${ticket.category} (Severity ${ticket.severity}/5) at Ward 14 Delhi. Status: ${ticket.status}. Verify and track: https://civicfeed.org/t/${ticket.id}`,
      });
    } catch {
      // dismissed
    }
  };

  const canVerify = ticket.status === 'PROVISIONAL_FIX';

  return (
    <View style={styles.card}>
      {/* 1. Header: User Handle, Ward Pill, Relative Timestamp */}
      <View style={styles.headerRow}>
        <View style={styles.authorGroup}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>A</Text>
          </View>
          <View>
            <View style={styles.nameAndWard}>
              <Text style={styles.authorHandle}>Auditor_Anonymous</Text>
              <View style={styles.wardBadge}>
                <Text style={styles.wardText}>{ticket.ward_id || 'Ward 14'}</Text>
              </View>
            </View>
            <Text style={styles.timestamp}>{formatTimeAgo(ticket.created_at)}</Text>
          </View>
        </View>
        <StatusBadge status={ticket.status} />
      </View>

      {/* 2. Metadata Bar: Category Tag & Severity Meter */}
      <View style={styles.metaRow}>
        <View style={styles.categoryBadge}>
          {getCategoryIcon(ticket.category)}
          <Text style={styles.categoryText}>{ticket.category.replace('_', ' ')}</Text>
        </View>
        <SeverityMeter severity={ticket.severity} />
      </View>

      {/* 3. Location Bar */}
      <View style={styles.locationRow}>
        <MapPin size={13} color="#64748B" />
        <Text style={styles.locationText} numberOfLines={1}>
          {ticket.latitude.toFixed(4)}, {ticket.longitude.toFixed(4)} • Near Central Delhi Corridor
        </Text>
      </View>

      {/* 4. Media Section: Single Photo OR Before/After Slider */}
      {ticket.status === 'PROVISIONAL_FIX' && ticket.resolution_photo_url ? (
        <BeforeAfterView
          beforeUrl={ticket.report_photo_url}
          afterUrl={ticket.resolution_photo_url}
        />
      ) : (
        <View style={styles.singleImageContainer}>
          <Image
            source={{ uri: ticket.report_photo_url }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {ticket.status === 'WEATHER_OCCLUDED' && (
            <View style={styles.weatherBanner}>
              <MonsoonPauseIcon size={16} color="#38BDF8" />
              <Text style={styles.weatherBannerText}>
                Monsoon Pause • Submerged road hazard. SLA paused until drainage clears.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 5. Geofence Distance Indicator */}
      {canVerify && (
        <View style={styles.geofenceContainer}>
          <GeofencePill distanceMeters={distance} maxMeters={50} />
        </View>
      )}

      {/* 6. Social Action & Civic Endorsement Area */}
      <View style={styles.actionContainer}>
        <View style={styles.endorseWrapper}>
          <TouchableOpacity
            style={[styles.endorseButton, hasEndorsed && styles.endorseButtonActive]}
            onPress={handleEndorse}
            activeOpacity={0.7}
          >
            <ImpactFlameIcon
              size={18}
              color={hasEndorsed ? '#EA580C' : '#64748B'}
              fill={hasEndorsed ? '#EA580C' : 'none'}
            />
            <View style={styles.endorseTextColumn}>
              <View style={styles.endorseTitleRow}>
                <Text style={[styles.endorseTitle, hasEndorsed && styles.endorseTitleActive]}>
                  I Hit This Too! ({upvotes})
                </Text>
              </View>
              <Text style={styles.endorseSubtitle}>
                Endorse hazard • Escalates repair SLA (+25 pts)
              </Text>
            </View>

            {showBonus && (
              <View style={styles.floatingBonus}>
                <Text style={styles.floatingBonusText}>+25 pts!</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Info trigger for "I Hit This Too!" mechanic */}
          <TouchableOpacity
            style={styles.infoTrigger}
            onPress={() => setShowEscalationModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Info size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Secondary Actions: Verify Fix or Share */}
        <View style={styles.secondaryActions}>
          {canVerify ? (
            <TouchableOpacity
              style={[
                styles.verifyButton,
                distance <= 50 ? styles.verifyButtonActive : styles.verifyButtonDisabled,
              ]}
              onPress={() => onVerifyPress(ticket)}
              disabled={distance > 50}
              activeOpacity={0.8}
            >
              <ShieldCheck size={16} color="#FFFFFF" />
              <Text style={styles.verifyButtonText}>
                {distance <= 50 ? 'Audit Fix (+150p)' : 'Move Within 50m'}
              </Text>
            </TouchableOpacity>
          ) : (
            ticket.status === 'RESOLVED' && (
              <View style={styles.resolvedBadge}>
                <CheckCircle2 size={14} color="#16A34A" />
                <Text style={styles.resolvedText}>Verified Clean</Text>
              </View>
            )
          )}

          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
            <Share2 size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. Civic SLA Escalation Explainer Modal */}
      <Modal
        visible={showEscalationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEscalationModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <ImpactFlameIcon size={20} color="#EA580C" fill="#EA580C" />
                <Text style={styles.modalTitle}>Why tap &quot;I Hit This Too!&quot;?</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEscalationModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalPoint}>
                <TrendingUp size={18} color="#EA580C" style={styles.pointIcon} />
                <View style={styles.pointTextGroup}>
                  <Text style={styles.pointHeading}>Priority Escalation</Text>
                  <Text style={styles.pointDescription}>
                    Every citizen endorsement moves this hazard up the municipal repair priority queue.
                  </Text>
                </View>
              </View>

              <View style={styles.modalPoint}>
                <Clock size={18} color="#0284C7" style={styles.pointIcon} />
                <View style={styles.pointTextGroup}>
                  <Text style={styles.pointHeading}>48-Hour SLA Trigger</Text>
                  <Text style={styles.pointDescription}>
                    Defects with 5+ endorsements trigger the Municipal Rapid Response SLA, cutting repair turnaround from 7 days to 48 hours.
                  </Text>
                </View>
              </View>

              <View style={styles.modalPoint}>
                <Award size={18} color="#10B981" style={styles.pointIcon} />
                <View style={styles.pointTextGroup}>
                  <Text style={styles.pointHeading}>Citizen Escrow Bounty</Text>
                  <Text style={styles.pointDescription}>
                    You immediately receive +25 civic reputation points in your Ward 14 profile for confirming the active hazard.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={() => setShowEscalationModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalConfirmText}>Got it, thanks!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
  nameAndWard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorHandle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  wardBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wardText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  timestamp: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  singleImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  weatherBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#38BDF8',
  },
  weatherBannerText: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  geofenceContainer: {
    marginTop: 10,
  },
  actionContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  endorseWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  endorseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    gap: 10,
    minHeight: 52,
  },
  endorseButtonActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  endorseTextColumn: {
    flex: 1,
  },
  endorseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  endorseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  endorseTitleActive: {
    color: '#C2410C',
  },
  endorseSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  floatingBonus: {
    position: 'absolute',
    top: -14,
    right: 12,
    backgroundColor: '#EA580C',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  floatingBonusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  infoTrigger: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 46,
  },
  verifyButtonActive: {
    backgroundColor: '#059669',
  },
  verifyButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resolvedText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBody: {
    gap: 14,
    marginBottom: 20,
  },
  modalPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pointIcon: {
    marginTop: 2,
  },
  pointTextGroup: {
    flex: 1,
  },
  pointHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  pointDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  modalConfirmButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
