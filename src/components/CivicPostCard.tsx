import React, { useState } from 'react';
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
  Flame,
  CheckCircle2,
  Share2,
  AlertCircle,
  Trash2,
  Sun,
  Droplets,
  ShieldCheck,
} from 'lucide-react-native';
import { Ticket, TicketCategory } from '../types';
import { SeverityMeter } from './SeverityMeter';
import { StatusBadge } from './StatusBadge';
import { BeforeAfterView } from './BeforeAfterView';
import { GeofencePill } from './GeofencePill';
import { calculateHaversineDistance } from '../services/location';

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

  const distance = calculateHaversineDistance(
    userCoords.latitude,
    userCoords.longitude,
    ticket.latitude,
    ticket.longitude
  );

  const getCategoryIcon = (cat: TicketCategory) => {
    switch (cat) {
      case 'POTHOLE':
        return <AlertCircle size={15} color="#DC2626" />;
      case 'GARBAGE_ACCUMULATION':
        return <Trash2 size={15} color="#D97706" />;
      case 'STREETLIGHT':
        return <Sun size={15} color="#EAB308" />;
      case 'OPEN_DRAIN':
        return <Droplets size={15} color="#2563EB" />;
      default:
        return <AlertCircle size={15} color="#64748B" />;
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
        message: `🚨 Civic Alert on CivicFeed: ${ticket.category} (Severity ${ticket.severity}/5) at Ward 14. Status: ${ticket.status}. Verify and track: https://civicfeed.org/t/${ticket.id}`,
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
          {ticket.latitude.toFixed(4)}, {ticket.longitude.toFixed(4)} • Near Sony Signal Corridor
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
              <Text style={styles.weatherBannerText}>
                🌧️ Pothole submerged by rainwater. Closure paused for safety.
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

      {/* 6. Social Action Bar */}
      <View style={styles.actionBar}>
        {/* Endorse / I Hit This Too! */}
        <TouchableOpacity
          style={[styles.actionButton, hasEndorsed && styles.actionButtonActive]}
          onPress={handleEndorse}
          activeOpacity={0.7}
        >
          <Flame size={17} color={hasEndorsed ? '#EA580C' : '#64748B'} />
          <Text style={[styles.actionText, hasEndorsed && styles.actionTextActive]}>
            I Hit This Too! ({upvotes})
          </Text>
          {showBonus && (
            <View style={styles.floatingBonus}>
              <Text style={styles.floatingBonusText}>+25 pts!</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Verify Fix Action */}
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
              {distance <= 50 ? 'Audit Fix (+150p)' : 'Move Closer'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.resolvedBadgeHolder}>
            {ticket.status === 'RESOLVED' && (
              <View style={styles.closedTag}>
                <CheckCircle2 size={14} color="#16A34A" />
                <Text style={styles.closedTagText}>Verified Clean</Text>
              </View>
            )}
          </View>
        )}

        {/* Share Button */}
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <Share2 size={16} color="#64748B" />
        </TouchableOpacity>
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
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    backgroundColor: 'rgba(30, 58, 138, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weatherBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  geofenceContainer: {
    marginTop: 10,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  actionButtonActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  actionTextActive: {
    color: '#C2410C',
  },
  floatingBonus: {
    position: 'absolute',
    top: -24,
    left: 10,
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  floatingBonusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
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
  resolvedBadgeHolder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  closedTagText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
});
