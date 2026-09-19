import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileCheck,
  FolderTree,
  ListFilter,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CertificateData, CivicTask, GroupedDomain, UserTasksResponse } from '../types';
import { OfficialCertificateModal } from '../components/OfficialCertificateModal';

export const TasksScreen: React.FC = () => {
  const { currentUser, currentPersona } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasksData, setTasksData] = useState<UserTasksResponse | null>(null);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'timeline'>('grouped');

  const fetchTasks = async () => {
    try {
      const data = await api.getUserTasks(currentUser.id);
      setTasksData(data);
    } catch (err) {
      console.log('Error fetching tasks', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUser.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleOpenCertificate = async () => {
    setGeneratingCert(true);
    try {
      const cert = await api.generateCertificate(currentUser.id);
      setCertificate(cert);
      setCertModalVisible(true);
    } catch (err) {
      console.log('Error generating certificate', err);
    } finally {
      setGeneratingCert(false);
    }
  };

  const toggleDomain = (domainId: string) => {
    setExpandedDomain(expandedDomain === domainId ? null : domainId);
  };

  const totalHours = tasksData?.grouped_domains?.reduce((sum, d) => sum + d.earned_hours, 0) || 14.5;
  const totalTasks = tasksData?.total_unique_tasks || 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Citizen Contributions</Text>
            <Text style={styles.headerSubtitle}>
              AI Task Accumulation & Grouped Certification
            </Text>
          </View>
          <View style={styles.badgeIdentity}>
            <ShieldCheck size={14} color="#16A34A" />
            <Text style={styles.badgeIdentityText}>Verified</Text>
          </View>
        </View>

        {/* Certificate CTA Banner */}
        <View style={styles.certBanner}>
          <View style={styles.certBannerTop}>
            <View style={styles.certIconWrap}>
              <Award size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.certBannerTitle}>Official Civic Impact Credential</Text>
              <Text style={styles.certBannerSubtitle}>
                Co-signed by MCD & PRAYAS for Academic/NSS Credits
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxVal}>{totalTasks}</Text>
              <Text style={styles.statBoxLbl}>Unique Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statBoxVal, { color: '#16A34A' }]}>{totalHours.toFixed(1)}h</Text>
              <Text style={styles.statBoxLbl}>Verified Hours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statBoxVal, { color: '#2563EB' }]}>
                {(totalTasks * 850).toLocaleString()}+
              </Text>
              <Text style={styles.statBoxLbl}>Citizens Helped</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.certGenerateBtn}
            onPress={handleOpenCertificate}
            disabled={generatingCert}
            activeOpacity={0.85}
          >
            {generatingCert ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <FileCheck size={18} color="#FFFFFF" />
                <Text style={styles.certGenerateBtnText}>
                  Generate Official Certificate
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* View Switcher: AI Grouped vs Timeline */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            style={[styles.switchTab, viewMode === 'grouped' && styles.switchTabActive]}
            onPress={() => setViewMode('grouped')}
            activeOpacity={0.8}
          >
            <FolderTree size={16} color={viewMode === 'grouped' ? '#FFFFFF' : '#64748B'} />
            <Text
              style={[
                styles.switchTabText,
                viewMode === 'grouped' && styles.switchTabTextActive,
              ]}
            >
              AI Grouped Domains
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchTab, viewMode === 'timeline' && styles.switchTabActive]}
            onPress={() => setViewMode('timeline')}
            activeOpacity={0.8}
          >
            <Clock size={16} color={viewMode === 'timeline' ? '#FFFFFF' : '#64748B'} />
            <Text
              style={[
                styles.switchTabText,
                viewMode === 'timeline' && styles.switchTabTextActive,
              ]}
            >
              All Tasks Timeline
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
            <Text style={styles.loadingText}>Accumulating completed tasks...</Text>
          </View>
        ) : viewMode === 'grouped' ? (
          /* Grouped Domains View */
          <View style={styles.domainsList}>
            <View style={styles.aiHeaderPill}>
              <Sparkles size={14} color="#7C3AED" />
              <Text style={styles.aiHeaderText}>
                AI grouped {totalTasks} unique completed tasks into {tasksData?.grouped_domains?.length || 0} civic domains
              </Text>
            </View>

            {tasksData?.grouped_domains?.map((domain: GroupedDomain) => {
              const isExpanded = expandedDomain === domain.domain_id;
              return (
                <View key={domain.domain_id} style={styles.domainCard}>
                  <TouchableOpacity
                    style={styles.domainCardHeader}
                    onPress={() => toggleDomain(domain.domain_id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.domainCardTitle}>{domain.title}</Text>
                      <Text style={styles.domainCardJurisdiction}>{domain.jurisdiction}</Text>
                      <Text style={styles.domainCardMetric}>• {domain.impact_metric}</Text>
                    </View>
                    <View style={styles.domainRight}>
                      <View style={styles.domainPill}>
                        <Text style={styles.domainPillTasks}>{domain.task_count} tasks</Text>
                        <Text style={styles.domainPillHours}>{domain.earned_hours}h</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={20} color="#64748B" />
                      ) : (
                        <ChevronDown size={20} color="#64748B" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Individual Tasks */}
                  {isExpanded && (
                    <View style={styles.expandedTasksBox}>
                      <Text style={styles.expandedHeading}>CONTRIBUTING TASKS:</Text>
                      {domain.tasks.map((task, idx) => (
                        <View key={task.task_id || idx} style={styles.taskItem}>
                          <CheckCircle2 size={16} color="#16A34A" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.taskItemTitle}>{task.title}</Text>
                            <Text style={styles.taskItemDesc}>{task.description}</Text>
                            <View style={styles.taskMetaRow}>
                              <Text style={styles.taskMetaText}>
                                {task.ward_id} • {task.task_type.replace('_', ' ')}
                              </Text>
                              <Text style={styles.taskMetaHours}>+{task.earned_hours}h</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          /* All Tasks Timeline View */
          <View style={styles.timelineList}>
            {tasksData?.tasks?.map((task: CivicTask, idx: number) => (
              <View key={task.task_id || idx} style={styles.timelineItem}>
                <View style={styles.timelineIconCol}>
                  <View style={styles.timelineDot}>
                    <CheckCircle2 size={14} color="#FFFFFF" />
                  </View>
                  {idx < (tasksData?.tasks?.length || 0) - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineTopRow}>
                    <Text style={styles.timelineTitle}>{task.title}</Text>
                    <View style={styles.hoursTag}>
                      <Text style={styles.hoursTagText}>+{task.earned_hours}h</Text>
                    </View>
                  </View>
                  <Text style={styles.timelineDesc}>{task.description}</Text>
                  <View style={styles.timelineFooter}>
                    <Text style={styles.timelineMeta}>
                      {task.ward_id} • {task.status}
                    </Text>
                    {task.timestamp && (
                      <Text style={styles.timelineTime}>
                        {new Date(task.timestamp).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Official Certificate Modal */}
      <OfficialCertificateModal
        visible={certModalVisible}
        certificate={certificate}
        onClose={() => setCertModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badgeIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeIdentityText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
  certBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  certBannerTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  certIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  certBannerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statBoxVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  statBoxLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  certGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
  },
  certGenerateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  switchTabActive: {
    backgroundColor: '#0F172A',
  },
  switchTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  switchTabTextActive: {
    color: '#FFFFFF',
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
  },
  domainsList: {
    gap: 10,
  },
  aiHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  aiHeaderText: {
    fontSize: 11,
    color: '#6B21A8',
    fontWeight: '700',
    flex: 1,
  },
  domainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  domainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  domainCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  domainCardJurisdiction: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 2,
  },
  domainCardMetric: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  domainRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  domainPill: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  domainPillTasks: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  domainPillHours: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  expandedTasksBox: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 14,
    gap: 10,
  },
  expandedHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  taskItemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  taskMetaText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  taskMetaHours: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '800',
  },
  timelineList: {
    paddingLeft: 6,
    paddingTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  hoursTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  hoursTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  timelineDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timelineMeta: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timelineTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
