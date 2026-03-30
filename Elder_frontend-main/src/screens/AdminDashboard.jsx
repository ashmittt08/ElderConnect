import { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import api from "../api";
import AdminSidebar, { MobileBottomBar } from "../components/AdminSidebar";
import useResponsive from "../hooks/useResponsive";

const colors = {
  bg: "#0F172A",
  sidebar: "#0B1220",
  card: "#1E293B",
  border: "#334155",
  primary: "#4799EB",
  primaryDark: "#2563EB",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  text: "#F1F5F9",
  muted: "#94A3B8",
  cardHover: "#273548",
};

export default function AdminDashboard({ navigation }) {
  const { user } = useContext(AuthContext);
  const responsive = useResponsive();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState(null);


  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get("/admin/dashboard-stats");
      setDashboardData(res.data);
    } catch (err) {
      console.error("ADMIN DASHBOARD ERROR:", err.response?.data || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleApproveNGO = async (id) => {
    try {
      await api.post(`/admin/approve-ngo/${id}`);
      fetchDashboard();
    } catch (err) {
      console.error("APPROVE NGO ERROR:", err.response?.data || err);
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      await api.post(`/admin/toggle-block/${id}`);
      fetchDashboard();
    } catch (err) {
      console.error("TOGGLE BLOCK ERROR:", err.response?.data || err);
    }
  };

  const handleVerifyUser = async (id, status) => {
    try {
      await api.put(`/admin/verify-user/${id}`, { status });
      fetchDashboard();
    } catch (err) {
      console.error("VERIFY USER ERROR:", err.response?.data || err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { stats, usersByRole, requestsByType, requestsByStatus, recentUsers, pendingNGOs, flaggedReports, recentRequests } =
    dashboardData || {};

  const getRoleCount = (role) => {
    const entry = usersByRole?.find((r) => r._id === role);
    return entry?.count || 0;
  };

  const getRequestTypeCount = (type) => {
    const entry = requestsByType?.find((r) => r._id === type);
    return entry?.count || 0;
  };

  const getRequestStatusCount = (status) => {
    const entry = requestsByStatus?.find((r) => r._id === status);
    return entry?.count || 0;
  };

  const totalRequestsAll = (requestsByType || []).reduce((sum, r) => sum + r.count, 0) || 1;



  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}>
        <AdminSidebar navigation={navigation} activeKey="AdminDashboard" />

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { padding: responsive.contentPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <Text style={styles.heading}>Admin Dashboard</Text>
          <Text style={styles.subheading}>
            Overview of platform activities and management tools
          </Text>

          {/* Stat Cards Row */}
          <View style={[
            styles.statsRow, 
            { 
              flexDirection: "row", 
              flexWrap: "wrap", 
              justifyContent: "center",
              gap: 16,
              marginBottom: 32 
            }
          ]}>
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              change="+10%"
              positive
              color={colors.primary}
              width={responsive.isMobile ? "100%" : "48%"}
            />
            <StatCard
              title="Active NGOs"
              value={stats?.activeNGOs || 0}
              change="+5%"
              positive
              color={colors.success}
              width={responsive.isMobile ? "100%" : "48%"}
            />
            <StatCard
              title="Daily Activities"
              value={stats?.dailyActivities || 0}
              change="+8%"
              positive
              color={colors.warning}
              width={responsive.isMobile ? "100%" : "48%"}
            />
            <StatCard
              title="Pending Verifications"
              value={stats?.reportsPending || 0}
              change={stats?.reportsPending > 0 ? "Needs attention" : "All clear"}
              positive={stats?.reportsPending === 0}
              color={colors.danger}
              width={responsive.isMobile ? "100%" : "48%"}
            />
          </View>

          {/* ── User Management Section ── */}
          <SectionHeader title="User Management" icon="👥" />
          <View style={styles.sectionCard}>
            <Table
              headers={["Name", "Email", "Role", "Status"]}
              rows={
                recentUsers && recentUsers.length > 0
                  ? recentUsers.map((u) => ({
                      cells: [
                        u.name || "—",
                        u.email || "—",
                        u.role?.charAt(0).toUpperCase() + u.role?.slice(1) || "—",
                        u.approved ? "Active" : "Blocked",
                      ],
                      statusColor: u.approved ? colors.success : colors.danger,
                    }))
                  : [{ cells: ["No users found", "", "", ""], statusColor: colors.muted }]
              }
            />
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("ManageUsers")}
            >
              <Text style={styles.viewAllText}>View All Users →</Text>
            </TouchableOpacity>
          </View>

          {/* ── NGO Approvals Section ── */}
          <SectionHeader title="NGO Approvals" icon="✅" />
          <View style={styles.sectionCard}>
            {pendingNGOs && pendingNGOs.length > 0 ? (
              pendingNGOs.map((ngo) => (
                <View key={ngo._id} style={styles.approvalRow}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalName}>{ngo.name}</Text>
                    <Text style={styles.approvalEmail}>{ngo.email}</Text>
                    <Text style={styles.approvalDate}>
                      Applied: {new Date(ngo.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApproveNGO(ngo._id)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>No pending NGO approvals</Text>
              </View>
            )}
          </View>

          {/* ── Activity Monitoring Section ── */}
          <SectionHeader title="Activity Monitoring" icon="📈" />
          <View style={[styles.activityGrid, { flexDirection: responsive.chartRow ? "row" : "column" }]}>
            {/* Daily Active Users Card */}
            <View style={[styles.sectionCard, styles.activityCard]}>
              <Text style={styles.activityCardTitle}>Daily Active Users</Text>
              <Text style={styles.activityBigNumber}>{stats?.dailyActivities || 0}</Text>
              <Text style={styles.activitySubtext}>Last 7 Days</Text>
              <View style={styles.chartContainer}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                  const heights = [45, 65, 55, 70, 80, 50, 60];
                  return (
                    <View key={day} style={styles.chartBarWrapper}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: heights[i],
                            backgroundColor:
                              i === 4 ? colors.primary : `${colors.primary}80`,
                          },
                        ]}
                      />
                      <Text style={styles.chartLabel}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Activities by Type Card */}
            <View style={[styles.sectionCard, styles.activityCard]}>
              <Text style={styles.activityCardTitle}>Activities by Type</Text>
              <Text style={styles.activityBigNumber}>{stats?.totalRequests || 0}</Text>
              <Text style={styles.activitySubtext}>Total Requests</Text>
              <View style={styles.typeBreakdown}>
                {[
                  { label: "Medicine", type: "medicine", color: colors.primary },
                  { label: "Food", type: "food", color: colors.success },
                  { label: "Emergency", type: "emergency", color: colors.danger },
                ].map((item) => {
                  const count = getRequestTypeCount(item.type);
                  const pct = totalRequestsAll > 0 ? (count / totalRequestsAll) * 100 : 0;
                  return (
                    <View key={item.type} style={styles.typeRow}>
                      <View style={styles.typeLabelRow}>
                        <View style={[styles.typeDot, { backgroundColor: item.color }]} />
                        <Text style={styles.typeLabel}>{item.label}</Text>
                        <Text style={styles.typeCount}>{count}</Text>
                      </View>
                      <View style={styles.typeBarBg}>
                        <View
                          style={[
                            styles.typeBarFill,
                            {
                              width: `${Math.max(pct, 2)}%`,
                              backgroundColor: item.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Request Status Summary */}
              <View style={styles.statusSummary}>
                <Text style={styles.statusSummaryTitle}>By Status</Text>
                <View style={styles.statusRow}>
                  {[
                    { label: "Pending", status: "pending", color: colors.warning },
                    { label: "Assigned", status: "assigned", color: colors.primary },
                    { label: "Completed", status: "completed", color: colors.success },
                  ].map((item) => (
                    <View key={item.status} style={styles.statusBadge}>
                      <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                      <Text style={styles.statusLabel}>{item.label}</Text>
                      <Text style={[styles.statusValue, { color: item.color }]}>
                        {getRequestStatusCount(item.status)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ── Pending Verifications Section ── */}
          <SectionHeader title="Pending Verifications" icon="📄" />
          <View style={styles.sectionCard}>
            {flaggedReports && flaggedReports.length > 0 ? (
              flaggedReports.map((report) => (
                <View key={report._id} style={styles.reportRow}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportName}>{report.name}</Text>
                    <Text style={styles.reportEmail}>{report.email}</Text>
                    <Text style={styles.reportMeta}>
                      Role: {report.role?.charAt(0).toUpperCase() + report.role?.slice(1)} •{" "}
                      ID Type: {report.verification?.idType || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.reportActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.viewDocsButton]}
                      onPress={() => setSelectedDocs({ ...report.verification, name: report.name })}
                    >
                      <Text style={styles.actionButtonText}>View Docs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.verifyButton]}
                      onPress={() => handleVerifyUser(report._id, "verified")}
                    >
                      <Text style={styles.actionButtonText}>Verify</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleVerifyUser(report._id, "rejected")}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>No pending verifications</Text>
              </View>
            )}
          </View>

          {/* Bottom padding */}
          <View style={{ height: responsive.showBottomBar ? 80 : 40 }} />
        </ScrollView>

        <MobileBottomBar navigation={navigation} activeKey="AdminDashboard" />
      </View>

      {/* Document Viewer Modal */}
      <Modal
        visible={!!selectedDocs}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedDocs(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDocs?.name}'s Documents</Text>
              <TouchableOpacity onPress={() => setSelectedDocs(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {selectedDocs?.idFrontUrl ? (
                <View style={styles.docImageContainer}>
                  <Text style={styles.docLabel}>ID Front</Text>
                  <Image source={{ uri: selectedDocs.idFrontUrl }} style={styles.docImage} resizeMode="contain" />
                </View>
              ) : null}
              {selectedDocs?.idBackUrl ? (
                <View style={styles.docImageContainer}>
                  <Text style={styles.docLabel}>ID Back</Text>
                  <Image source={{ uri: selectedDocs.idBackUrl }} style={styles.docImage} resizeMode="contain" />
                </View>
              ) : null}
              {selectedDocs?.selfieUrl ? (
                <View style={styles.docImageContainer}>
                  <Text style={styles.docLabel}>Selfie</Text>
                  <Image source={{ uri: selectedDocs.selfieUrl }} style={styles.docImage} resizeMode="contain" />
                </View>
              ) : null}
              
              {!selectedDocs?.idFrontUrl && !selectedDocs?.idBackUrl && !selectedDocs?.selfieUrl && (
                <Text style={styles.noDocsText}>No documents uploaded by this user.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Sub Components ── */

const SectionHeader = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionIcon}>{icon}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const StatCard = ({ title, value, change, positive, color, width }) => (
  <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3, width: width || "100%" }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{typeof value === "number" ? value.toLocaleString() : value}</Text>
    <Text style={[styles.statChange, { color: positive ? colors.success : colors.danger }]}>
      {change}
    </Text>
  </View>
);

const Table = ({ headers, rows }) => (
  <View style={styles.table}>
    <View style={styles.tableHeader}>
      {headers.map((h, i) => (
        <Text key={i} style={styles.tableHeaderText}>
          {h}
        </Text>
      ))}
    </View>
    {rows.map((row, i) => (
      <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
        {row.cells.map((cell, j) => (
          <View key={j} style={styles.cell}>
            {j === headers.length - 1 && row.statusColor ? (
              <View style={styles.statusCellContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: row.statusColor }]} />
                <Text style={[styles.cellText, { color: row.statusColor }]}>{cell}</Text>
              </View>
            ) : (
              <Text style={styles.cellText}>{cell}</Text>
            )}
          </View>
        ))}
      </View>
    ))}
  </View>
);

/* ── Styles ── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { color: colors.muted, fontSize: 16 },

  layout: {
    flex: 1,
  },

  // Sidebar
  sidebar: {
    width: 260,
    backgroundColor: colors.sidebar,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  hub: { color: colors.muted, marginTop: 4, fontSize: 13 },
  sidebarNav: { padding: 12 },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
  },
  sidebarItemActive: {
    backgroundColor: `${colors.primary}18`,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  sidebarIcon: { fontSize: 18 },
  sidebarText: { color: colors.muted, fontSize: 14, fontWeight: "500" },
  sidebarTextActive: { color: colors.primary, fontWeight: "600" },

  // Content
  content: { flex: 1 },
  contentContainer: {},
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subheading: { color: colors.muted, marginBottom: 28, marginTop: 6, fontSize: 15 },

  // Stat cards
  statsRow: {
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.card,
    padding: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statTitle: { color: colors.muted, fontSize: 13, fontWeight: "500", marginBottom: 10 },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  statChange: { fontSize: 13, fontWeight: "600" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    marginTop: 12,
  },
  sectionIcon: { fontSize: 22 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },

  // Section card
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 24,
    overflow: "hidden",
  },

  // Table
  table: {
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tableHeaderText: {
    flex: 1,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: `${colors.border}60`,
  },
  tableRowAlt: { backgroundColor: `${colors.bg}40` },
  cell: { flex: 1, justifyContent: "center" },
  cellText: { color: colors.text, fontSize: 14 },
  statusCellContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },

  // View all button
  viewAllButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: `${colors.primary}12`,
    borderRadius: 8,
  },
  viewAllText: { color: colors.primary, fontWeight: "600", fontSize: 14 },

  // NGO Approvals
  approvalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: `${colors.border}60`,
  },
  approvalInfo: { flex: 1 },
  approvalName: { color: colors.text, fontWeight: "600", fontSize: 16 },
  approvalEmail: { color: colors.muted, fontSize: 13, marginTop: 2 },
  approvalDate: { color: colors.muted, fontSize: 12, marginTop: 4 },
  approveButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Activity monitoring
  activityGrid: {
    gap: 16,
    marginBottom: 8,
  },
  activityCard: { flex: 1 },
  activityCardTitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  activityBigNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
  },
  activitySubtext: { color: colors.muted, fontSize: 13, marginBottom: 20 },

  // Chart bars
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    gap: 8,
    marginTop: 8,
  },
  chartBarWrapper: { alignItems: "center", flex: 1, gap: 6 },
  chartBar: { width: "100%", borderRadius: 4, minWidth: 20 },
  chartLabel: { color: colors.muted, fontSize: 11 },

  // Type breakdown
  typeBreakdown: { marginTop: 16, gap: 14 },
  typeRow: { gap: 6 },
  typeLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
  typeLabel: { color: colors.text, fontSize: 14, flex: 1 },
  typeCount: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  typeBarBg: {
    height: 8,
    backgroundColor: `${colors.border}60`,
    borderRadius: 4,
    overflow: "hidden",
  },
  typeBarFill: { height: "100%", borderRadius: 4 },

  // Status summary
  statusSummary: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderColor: colors.border },
  statusSummaryTitle: { color: colors.muted, fontSize: 13, fontWeight: "600", marginBottom: 12 },
  statusRow: { flexDirection: "row", gap: 12 },
  statusBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${colors.bg}60`,
    padding: 10,
    borderRadius: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { color: colors.muted, fontSize: 12, flex: 1 },
  statusValue: { fontSize: 16, fontWeight: "700" },

  // Flagged reports
  reportRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: `${colors.border}60`,
    gap: 12,
  },
  reportInfo: { flex: 1 },
  reportName: { color: colors.text, fontWeight: "600", fontSize: 16 },
  reportEmail: { color: colors.muted, fontSize: 13, marginTop: 2 },
  reportMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  reportActions: { flexDirection: "row", gap: 8 },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  verifyButton: { backgroundColor: colors.success },
  rejectButton: { backgroundColor: colors.danger },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: colors.muted, fontSize: 15 },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: "100%",
    maxWidth: 600,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.sidebar,
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: { color: colors.text, fontSize: 16, fontWeight: "bold" },
  modalScroll: { padding: 20 },
  docImageContainer: { marginBottom: 24 },
  docLabel: { color: colors.muted, fontSize: 14, fontWeight: "600", marginBottom: 12 },
  docImage: {
    width: "100%",
    height: 250,
    backgroundColor: colors.sidebar,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noDocsText: { color: colors.muted, textAlign: "center", marginVertical: 40 },
  viewDocsButton: { backgroundColor: colors.warning },
});
