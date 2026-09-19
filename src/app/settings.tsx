import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';

import { COLORS } from '@/constants/colors';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Notifications</Text>
              <Text style={styles.settingDescription}>Receive app notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.contentDark, true: COLORS.orange }}
              thumbColor={notificationsEnabled ? COLORS.white : COLORS.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Use dark theme</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: COLORS.contentDark, true: COLORS.orange }}
              thumbColor={darkModeEnabled ? COLORS.white : COLORS.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Location Services</Text>
              <Text style={styles.settingDescription}>Allow location access</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: COLORS.contentDark, true: COLORS.orange }}
              thumbColor={locationEnabled ? COLORS.white : COLORS.textSecondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionItemText}>View Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionItemText}>Privacy Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionItemText}>Data & Privacy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionItemText}>Terms of Service</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionItemText}>Report a Bug</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.orange,
    marginBottom: 8,
  },
  settingItem: {
    backgroundColor: COLORS.contentDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    flex: 1,
  },
  settingName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionItem: {
    backgroundColor: COLORS.contentDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
  },
  actionItemText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '500',
  },
  infoItem: {
    backgroundColor: COLORS.contentDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.headerDark,
  },
});
