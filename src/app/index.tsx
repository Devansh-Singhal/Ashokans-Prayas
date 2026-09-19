import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome to the App</Text>
          <Text style={styles.cardDescription}>
            This is your home screen. Navigate using the tabs below.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Features</Text>
          <Text style={styles.cardDescription}>
            • Browse and explore content{'\n'}
            • Search for items{'\n'}
            • Capture photos{'\n'}
            • Customize your settings
          </Text>
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
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.contentDark,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.orange,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});
