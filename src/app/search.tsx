import { StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS } from '@/constants/colors';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for something..."
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.itemsList}>
            <View style={styles.searchItem}>
              <Text style={styles.itemText}>Photography</Text>
            </View>
            <View style={styles.searchItem}>
              <Text style={styles.itemText}>Travel</Text>
            </View>
            <View style={styles.searchItem}>
              <Text style={styles.itemText}>Design</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Tags</Text>
          <View style={styles.tagsList}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>#nature</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>#adventure</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>#creativity</Text>
            </View>
          </View>
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
  searchBox: {
    backgroundColor: COLORS.contentDark,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.orange,
  },
  searchInput: {
    color: COLORS.white,
    fontSize: 16,
    paddingVertical: 8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.orange,
  },
  itemsList: {
    gap: 8,
  },
  searchItem: {
    backgroundColor: COLORS.contentDark,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
  },
  itemText: {
    fontSize: 14,
    color: COLORS.white,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.contentDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.orange,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.orange,
    fontWeight: '500',
  },
});
