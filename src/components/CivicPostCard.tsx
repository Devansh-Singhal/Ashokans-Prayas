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
  Share2,
  ShieldCheck,
  ThumbsUp,
} from 'lucide-react-native';
import { Ticket, TicketCategory } from '../types';
import { COLORS } from '../constants/colors';
import { SeverityMeter } from './SeverityMeter';
import { StatusBadge } from './StatusBadge';
import { BeforeAfterView } from './BeforeAfterView';
import { GeofencePill } from './GeofencePill';
import { calculateHaversineDistance } from '../services/location';
import { CAPS_LABEL, NUMERIC, TYPOGRAPHY } from '../constants/typography';
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
        message: `[CivicFeed Alert] ${ticket.category} (Severity ${ticket.severity}/5) at ${ticket.ward_id || 'Ward 14, Ludhiana, Punjab'}. Status: ${ticket.status}. Verify and track: ashokansprayas://ticket/${ticket.id}`,
      });
    } catch {
      // dismissed
    }
  };

  const canVerify = ticket.status === 'PROVISIONAL_FIX';

  const ticketTitle = (() => {
    switch (ticket.category) {
      case 'POTHOLE':
        return 'Pothole on the carriageway';
      case 'GARBAGE_ACCUMULATION':
        return 'Garbage pile needs clearing';
      case 'STREETLIGHT':
        return 'Streetlight not working';
      case 'OPEN_DRAIN':
        return 'Open drain hazard';
      case 'FOOTPATH_DAMAGE':
        return 'Damaged footpath';
      default:
        return 'Civic issue reported';
    }
  })();

  return (
    <View style={styles.card}>
      {/* 1. Header: avatar + handle left, plain status text right */}
      <View style={styles.headerRow}>
        <View style={styles.authorGroup}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{avatarInitial}</Text>
          </View>
          <View style={styles.authorText}>
            <Text style={styles.authorHandle} numberOfLines={1}>{authorHandle}</Text>
            <Text style={styles.timestamp} numberOfLines={1}>
              {ticket.ward_id === 'WARD_LUDHIANA_14' ? 'Ward 14' : (ticket.ward_id || 'Ward 14')} • {formatTimeAgo(ticket.created_at)}
            </Text>
          </View>
        </View>
        <StatusBadge status={ticket.status} />
      </View>

      {/* 2. Title: category headline, largest on the card */}
      <Text style={styles.postTitle}>{ticketTitle}</Text>

      {/* 3. Meta row: category tag, upvotes, severity */}
      <View style={styles.metaRow}>
        <View style={styles.categoryBadge}>
          {getCategoryIcon(ticket.category)}
          <Text style={styles.categoryText}>{ticket.category.replace(/_/g, ' ')}</Text>
        </View>
        <View style={styles.upvotePill}>
          <ThumbsUp size={12} color={COLORS.inkSoft} />
          <Text style={styles.upvoteText}>{ticket.upvotes}</Text>
        </View>
        <SeverityMeter severity={ticket.severity} />
      </View>

      {/* 3. Location Bar */}
      <View style={styles.locationRow}>
        <MapPin size={13} color="#64748B" />
        <Text style={styles.locationText} numberOfLines={1}>
          {ticket.latitude.toFixed(4)}, {ticket.longitude.toFixed(4)} • Near Dugri–Gill Road Corridor, Ludhiana
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
          <GeofencePill distanceMeters={distance} maxMeters={5} />
        </View>
      )}

      {/* 6. Audit & Share Actions */}
      <View style={styles.actionContainer}>
        <View style={styles.secondaryActions}>
          {canVerify ? (
            <TouchableOpacity
              style={[
                styles.verifyButton,
                distance <= 5 ? styles.verifyButtonActive : styles.verifyButtonDisabled,
              ]}
              onPress={() => onVerifyPress(ticket)}
              disabled={distance > 5}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: distance > 5 }}
            >
              <ShieldCheck size={16} color={distance <= 5 ? '#0B1B2F' : '#FFFFFF'} />
              <Text style={[styles.verifyButtonText, distance > 5 && { color: '#FFFFFF' }]}>
                {distance <= 5 ? 'Audit fix (+150 pts)' : 'Move within 5m'}
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
              <Text style={styles.resolvedText}>Verified Clean</Text>
            )
          )}

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Share ${ticket.category.replace(/_/g, ' ')} report`}
            accessibilityHint="Opens the share sheet with ticket details"
          >
            <Share2 size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#0B1B2F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.mist,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorGroup: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.white,
  },
  authorText: {
    flex: 1,
    flexShrink: 1,
  },
  authorHandle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    ...NUMERIC,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  postTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    ...TYPOGRAPHY.captionStrong,
    ...CAPS_LABEL,
    color: COLORS.text,
  },
  upvotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  upvoteText: {
    ...TYPOGRAPHY.captionStrong,
    ...NUMERIC,
    color: COLORS.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    ...TYPOGRAPHY.caption,
    ...NUMERIC,
    color: '#64748B',
    flex: 1,
  },
  singleImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
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
    backgroundColor: '#0B1B2F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#38BDF8',
  },
  weatherBannerText: {
    ...TYPOGRAPHY.captionStrong,
    color: '#E0F2FE',
    flex: 1,
  },
  geofenceContainer: {
    marginTop: 10,
  },
  actionContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E6EAF0',
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
    borderRadius: 10,
    minHeight: 48,
  },
  verifyButtonActive: {
    backgroundColor: COLORS.orange,
    borderBottomWidth: 2,
    borderBottomColor: '#D65400',
  },
  verifyButtonDisabled: {
    backgroundColor: '#6B7A90',
  },
  verifyButtonText: {
    ...TYPOGRAPHY.bodySmStrong,
    ...NUMERIC,
    color: COLORS.onOrange,
  },
  resolvedText: {
    ...TYPOGRAPHY.bodySmStrong,
    color: COLORS.verified,
    paddingVertical: 8,
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
  },
  occludedText: {
    ...TYPOGRAPHY.bodySmStrong,
    color: '#64748B',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
