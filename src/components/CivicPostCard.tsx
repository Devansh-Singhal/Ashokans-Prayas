import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import {
  MapPin,
  CheckCircle2,
  Share2,
  ShieldCheck,
} from 'lucide-react-native';
import { Ticket, TicketCategory } from '../types';
import { SeverityMeter } from './SeverityMeter';
import { StatusBadge } from './StatusBadge';
import { BeforeAfterView } from './BeforeAfterView';
import { GeofencePill } from './GeofencePill';
import { calculateHaversineDistance } from '../services/location';
import {
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
  onVerifyPress: (ticket: Ticket) => void;
}

export const CivicPostCard: React.FC<Props> = ({
  ticket,
  currentUserId,
  userCoords,
  onVerifyPress,
}) => {
  void currentUserId;

  const reporterId = (ticket as Ticket & { reporter_id?: string }).reporter_id;
  const authorHandle = reporterId
    ? 'Auditor_' + reporterId.slice(-4).toUpperCase()
    : 'Auditor_Anonymous';
  const avatarInitial = authorHandle.charAt(0);

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

  // Captured once at mount: reading the clock during render is impure and
  // makes the React Compiler's memoization unstable.
  const [nowMs] = React.useState(() => Date.now());

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffSec = Math.floor((nowMs - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `[CivicFeed Alert] ${ticket.category} (Severity ${ticket.severity}/5) at ${ticket.ward_id || 'Ward 14 Delhi'}. Status: ${ticket.status}. Verify and track: ashokansprayas://ticket/${ticket.id}`,
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
            <Text style={styles.avatarInitial}>{avatarInitial}</Text>
          </View>
          <View>
            <View style={styles.nameAndWard}>
              <Text style={styles.authorHandle}>{authorHandle}</Text>
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
          <Text style={styles.categoryText}>{ticket.category.replace(/_/g, ' ')}</Text>
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

      {/* 6. Audit & Share Actions */}
      <View style={styles.actionContainer}>
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
          ) : ticket.status === 'WEATHER_OCCLUDED' ? (
            <View
              style={styles.occludedPill}
              accessibilityLabel="Submerged — audit paused"
              accessible={true}
            >
              <Text style={styles.occludedText}>Submerged — audit paused</Text>
            </View>
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
    color: '#64748B',
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
  occludedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.8,
  },
  occludedText: {
    color: '#64748B',
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
});
