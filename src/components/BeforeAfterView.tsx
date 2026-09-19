import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { CAPS_LABEL, TYPOGRAPHY } from '../constants/typography';

interface Props {
  beforeUrl: string;
  afterUrl: string;
}

export const BeforeAfterView: React.FC<Props> = ({ beforeUrl, afterUrl }) => {
  const [activeTab, setActiveTab] = useState<'after' | 'before'>('after');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'before' && styles.activeTab]}
          onPress={() => setActiveTab('before')}
          activeOpacity={0.8}
        >
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.tabText, activeTab === 'before' && styles.activeTabText]}>
            BEFORE (Reported)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'after' && styles.activeTab]}
          onPress={() => setActiveTab('after')}
          activeOpacity={0.8}
        >
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.tabText, activeTab === 'after' && styles.activeTabText]}>
            AFTER (Fix Uploaded)
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: activeTab === 'before' ? beforeUrl : afterUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.pillOverlay}>
          <Text style={styles.pillText}>
            {activeTab === 'before' ? 'ORIGINAL CITIZEN REPORT' : 'CONTRACTOR PROVISIONAL REPAIR'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 10,
    margin: 8,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tabText: {
    ...TYPOGRAPHY.captionStrong,
    ...CAPS_LABEL,
    color: '#64748B',
  },
  activeTabText: {
    ...TYPOGRAPHY.captionStrong,
    ...CAPS_LABEL,
    color: '#0F172A',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 220,
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pillOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#FFFFFF',
  },
});
