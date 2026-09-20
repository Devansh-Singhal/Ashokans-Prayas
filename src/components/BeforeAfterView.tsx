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
          accessibilityRole="button"
          accessibilityState={{ selected: activeTab === 'before' }}
          accessibilityLabel="Show before photo"
        >
          <Text style={[styles.tabText, activeTab === 'before' && styles.activeTabText]} numberOfLines={1}>
            Before
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'after' && styles.activeTab]}
          onPress={() => setActiveTab('after')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: activeTab === 'after' }}
          accessibilityLabel="Show after photo"
        >
          <Text style={[styles.tabText, activeTab === 'after' && styles.activeTabText]} numberOfLines={1}>
            After
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: activeTab === 'before' ? beforeUrl : afterUrl }}
          style={styles.image}
          resizeMode="cover"
        />
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    gap: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF7A00',
  },
  tabText: {
    ...TYPOGRAPHY.captionStrong,
    ...CAPS_LABEL,
    color: '#64748B',
    textAlign: 'center',
  },
  activeTabText: {
    ...TYPOGRAPHY.captionStrong,
    ...CAPS_LABEL,
    color: '#0B1B2F',
    textAlign: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 220,
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
