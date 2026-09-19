import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { MapPin, Navigation, ExternalLink, ShieldCheck } from 'lucide-react-native';
import { Ticket, TicketStatus } from '../types';
import { api } from '../services/api';
import { InteractiveMap } from '../components/InteractiveMap';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityMeter } from '../components/SeverityMeter';
import { calculateHaversineDistance, getCurrentGPS, DELHI_WARD_14, LUDHIANA_CASE_STUDY } from '../services/location';
import {
  PotholeDefectIcon,
  WasteAccumulationIcon,
  StreetlightDefectIcon,
  OpenDrainHazardIcon,
} from '../components/CivicIcons';

type Ward = 'feed' | 'case';
type FilterType = 'ALL' | 'REPORTED' | 'PROVISIONAL_FIX' | 'RESOLVED' | 'WEATHER_OCCLUDED';

const WARD_AREAS = {
  feed: {
    wardId: DELHI_WARD_14.wardId,
    fallbackLabel: 'Demo location — enable GPS for live audit',
    emptyPlace: DELHI_WARD_14.shortLabel,
    area: {
      center: { ...DELHI_WARD_14.center },
      zoom: DELHI_WARD_14.zoom,
      pillLabel: DELHI_WARD_14.mapLabel,
      radarTitle: DELHI_WARD_14.areaTitle,
      radarSubtitle: DELHI_WARD_14.areaSubtitle,
      userPopupPlace: DELHI_WARD_14.userLabel,
      iframeTitle: 'CivicFeed Ward 14 Map',
    },
  },
  case: {
    wardId: LUDHIANA_CASE_STUDY.wardId,
    fallbackLabel: 'Case-study corridor — enable GPS for live audit',
    emptyPlace: LUDHIANA_CASE_STUDY.shortLabel,
    area: {
      center: { ...LUDHIANA_CASE_STUDY.center },
      zoom: LUDHIANA_CASE_STUDY.zoom,
      pillLabel: LUDHIANA_CASE_STUDY.mapLabel,
      radarTitle: LUDHIANA_CASE_STUDY.areaTitle,
      radarSubtitle: LUDHIANA_CASE_STUDY.areaSubtitle,
      userPopupPlace: LUDHIANA_CASE_STUDY.userLabel,
      iframeTitle: 'CivicFeed Ludhiana Case Study Map',
    },
  },
} as const;

export const MapScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const [activeWard, setActiveWard] = useState<Ward>('case');
  const ward = WARD_AREAS[activeWard];
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>({ latitude: DELHI_WARD_14.center.latitude, longitude: DELHI_WARD_14.center.longitude });
  const [usingFallback, setUsingFallback] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTicket(null);
    loadTickets();
  }, [activeWard]);

  useEffect(() => {
    (async () => {
      try {
        const gps = await getCurrentGPS();
        setUserCoords(gps);
        setUsingFallback(false);
      } catch {
        // Keep demo fallback coords
      }
    })();
  }, []);

  const loadTickets = async () => {
    try {
      setLoadError(null);
      const res = await api.getWardFeed(ward.wardId);
      setTickets(res.tickets);
      if (res.tickets.length > 0) {
        setSelectedTicket(res.tickets[0]);
      }
    } catch (err: any) {
      console.error('Failed to load tickets for map', err);
      setLoadError(err?.message || 'Failed to load tickets');
    }
  };

  const filteredTickets = useMemo(() => {
    if (activeFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.status === activeFilter);
  }, [tickets, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: tickets.length,
      reported: tickets.filter((t) => t.status === 'REPORTED').length,
      provisional: tickets.filter((t) => t.status === 'PROVISIONAL_FIX').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
      weather: tickets.filter((t) => t.status === 'WEATHER_OCCLUDED').length,
    };
  }, [tickets]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
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

  const formatCoord = (v: number | null | undefined): string =>
    typeof v === 'number' && Number.isFinite(v) ? v.toFixed(4) : '--';

  const selectedDistance = selectedTicket
    ? calculateHaversineDistance(
        userCoords.latitude,
        userCoords.longitude,
        selectedTicket.latitude,
        selectedTicket.longitude
      )
    : null;

  return (
    <View style={styles.container}>
      {/* Ward switcher: live feed vs Ludhiana case study (additive, above filters) */}
      <View style={styles.wardContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeWard === 'case' && styles.filterChipActive]}
            onPress={() => setActiveWard('case')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                activeWard === 'case' && styles.filterChipTextActive,
              ]}
            >
              Ludhiana Case Study
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeWard === 'feed' && styles.filterChipActive]}
            onPress={() => setActiveWard('feed')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                activeWard === 'feed' && styles.filterChipTextActive,
              ]}
            >
              Ward 14 Live
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Case-study explainer (renders only on the case tab) */}
      {activeWard === 'case' && (
        <View style={styles.caseCard}>
          <Text style={styles.caseTitle}>Ludhiana — Dugri &amp; Gill Road: the failure CivicFeed fixes</Text>
          <Text style={styles.caseBody}>
            Major roads left broken and excavated for 6+ months after water-pipeline work. When a
            pothole opens or a road caves in, the Municipal Corporation blames the Water Board, the
            Water Board blames the contractor, and the contractor claims monsoon delays — while the
            ticket sits marked work completed on a private portal and the fund is disbursed.
          </Text>
          <Text style={styles.caseBody}>
            Contracts require restoring roads to original condition, but nothing public verifies it.
            CivicFeed publishes every excavated road on an open hyperlocal feed and locks resolution
            to a 50-meter on-ground citizen check — dug-up roads can&apos;t be abandoned without
            cross-departmental exposure.
          </Text>
        </View>
      )}

      {/* 1. Header Filter Bar (Scrollable for mobile ergonomics) */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ALL')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              All ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'REPORTED' && styles.filterChipActive]}
            onPress={() => setActiveFilter('REPORTED')}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: '#EF4444' }]} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'REPORTED' && styles.filterChipTextActive,
              ]}
            >
              Open ({counts.reported})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'PROVISIONAL_FIX' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('PROVISIONAL_FIX')}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: '#F59E0B' }]} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'PROVISIONAL_FIX' && styles.filterChipTextActive,
              ]}
            >
              Fix Uploaded ({counts.provisional})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'RESOLVED' && styles.filterChipActive]}
            onPress={() => setActiveFilter('RESOLVED')}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: '#10B981' }]} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'RESOLVED' && styles.filterChipTextActive,
              ]}
            >
              Verified ({counts.resolved})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'WEATHER_OCCLUDED' && styles.filterChipActive]}
            onPress={() => setActiveFilter('WEATHER_OCCLUDED')}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: '#38BDF8' }]} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'WEATHER_OCCLUDED' && styles.filterChipTextActive,
              ]}
            >
              Submerged ({counts.weather})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 2. Interactive Map Viewport with Zero-Shift Pins */}
      {usingFallback && (
        <View style={styles.fallbackBanner}>
          <Text style={styles.fallbackText}>{ward.fallbackLabel}</Text>
        </View>
      )}
      {tickets.length === 0 && loadError && (
        <TouchableOpacity style={styles.retryBanner} onPress={loadTickets} activeOpacity={0.8}>
          <Text style={styles.retryBannerText}>Could not load map tickets. Tap to retry.</Text>
        </TouchableOpacity>
      )}
      <View style={styles.mapViewport}>
        <InteractiveMap
          tickets={filteredTickets}
          selectedTicket={selectedTicket}
          onSelectTicket={(ticket) => setSelectedTicket(ticket)}
          userCoords={userCoords}
          area={ward.area}
        />
      </View>

      {/* 3. Bottom Defect Inspection Drawer (Mobile-friendly, no buttons cut off) */}
      {selectedTicket && (
        <View style={styles.drawerCard}>
          <View style={styles.drawerHandle} />

          <View style={styles.drawerHeader}>
            <View style={styles.drawerCategoryBadge}>
              {getCategoryIcon(selectedTicket.category)}
              <Text style={styles.drawerCategoryText}>
                {selectedTicket.category.replace('_', ' ')}
              </Text>
            </View>
            <StatusBadge status={selectedTicket.status} />
          </View>

          <View style={styles.drawerContentRow}>
            {/* Thumbnail Image */}
            <Image
              source={{
                uri:
                  selectedTicket.status === 'PROVISIONAL_FIX' && selectedTicket.resolution_photo_url
                    ? selectedTicket.resolution_photo_url
                    : selectedTicket.report_photo_url,
              }}
              style={styles.thumbnail}
              resizeMode="cover"
            />

            {/* Defect Metadata */}
            <View style={styles.drawerDetails}>
              <View style={styles.severityContainer}>
                <Text style={styles.drawerMetaLabel}>Severity Rating:</Text>
                <SeverityMeter severity={selectedTicket.severity} />
              </View>

              <View style={styles.distanceRow}>
                <Navigation size={13} color="#38BDF8" />
                <Text style={styles.distanceText}>
                  {selectedDistance !== null
                    ? `${selectedDistance < 1000 ? `${Math.round(selectedDistance)}m` : `${(selectedDistance / 1000).toFixed(1)}km`} away`
                    : ward.emptyPlace}
                  {' • '}{formatCoord(selectedTicket.latitude)}, {formatCoord(selectedTicket.longitude)}
                </Text>
              </View>
            </View>
          </View>

          {/* Drawer Actions */}
          <View style={styles.actionRow}>
            {selectedTicket.status === 'PROVISIONAL_FIX' && (
              <View style={styles.auditPromptBox}>
                <ShieldCheck size={16} color="#10B981" />
                <Text style={styles.auditPromptText}>Fix ready for citizen audit — verify it in the feed</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  filterContainer: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 10,
  },
  wardContainer: {
    backgroundColor: '#1E293B',
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 11,
  },
  caseCard: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  caseTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  caseBody: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    minHeight: 36,
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  mapViewport: {
    flex: 1,
    position: 'relative',
  },
  drawerCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  drawerHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  drawerCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  drawerCategoryText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  drawerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  drawerDetails: {
    flex: 1,
    justifyContent: 'space-between',
    height: 76,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerMetaLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  auditPromptBox: {
    flex: 1,
    backgroundColor: '#064E3B',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  auditPromptText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
  },
  fallbackBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  fallbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
  },
  retryBanner: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  retryBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    textAlign: 'center',
  },
});
