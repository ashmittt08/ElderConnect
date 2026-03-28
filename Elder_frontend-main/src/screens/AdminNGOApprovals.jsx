import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminSidebar, { MobileBottomBar } from "../components/AdminSidebar";
import useResponsive from "../hooks/useResponsive";
import api from "../api";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#4799EB",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function AdminNGOApprovals({ navigation }) {
  const responsive = useResponsive();
  const [pendingNGOs, setPendingNGOs] = useState([]);
  const [approvedNGOs, setApprovedNGOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNGOs = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      const ngos = res.data.filter((u) => u.role === "ngo");
      setPendingNGOs(ngos.filter((n) => !n.approved));
      setApprovedNGOs(ngos.filter((n) => n.approved));
    } catch (err) {
      console.error("FETCH NGOs ERROR:", err.response?.data || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNGOs();
    }, [fetchNGOs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNGOs();
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/approve-ngo/${id}`);
      fetchNGOs();
    } catch (err) {
      console.error("APPROVE NGO ERROR:", err.response?.data || err);
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      await api.post(`/admin/toggle-block/${id}`);
      fetchNGOs();
    } catch (err) {
      console.error("TOGGLE BLOCK ERROR:", err.response?.data || err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading NGOs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}>
        <AdminSidebar navigation={navigation} activeKey="AdminNGOApprovals" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { padding: responsive.contentPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          <Text style={styles.heading}>NGO Approvals</Text>
          <Text style={styles.subheading}>
            review and approve NGO registration requests
          </Text>

          {/* Stats Row */}
          <View style={[styles.statsRow, { flexDirection: responsive.isMobile ? "column" : "row" }]}>
            <View style={[styles.statCard, { borderTopColor: colors.warning, borderTopWidth: 3 }]}>
              <Text style={styles.statTitle}>Pending Approval</Text>
              <Text style={styles.statValue}>{pendingNGOs.length}</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: colors.success, borderTopWidth: 3 }]}>
              <Text style={styles.statTitle}>Approved NGOs</Text>
              <Text style={styles.statValue}>{approvedNGOs.length}</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: colors.primary, borderTopWidth: 3 }]}>
              <Text style={styles.statTitle}>Total NGOs</Text>
              <Text style={styles.statValue}>{pendingNGOs.length + approvedNGOs.length}</Text>
            </View>
          </View>

          {/* Pending NGOs */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⏳</Text>
            <Text style={styles.sectionTitle}>Pending Approval ({pendingNGOs.length})</Text>
          </View>

          <View style={styles.sectionCard}>
            {pendingNGOs.length > 0 ? (
              pendingNGOs.map((ngo, i) => (
                <View
                  key={ngo._id}
                  style={[
                    styles.ngoRow,
                    i < pendingNGOs.length - 1 && styles.ngoRowBorder,
                  ]}
                >
                  <View style={styles.ngoAvatar}>
                    <Text style={styles.ngoAvatarText}>
                      {ngo.name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View style={styles.ngoInfo}>
                    <Text style={styles.ngoName}>{ngo.name}</Text>
                    <Text style={styles.ngoEmail}>{ngo.email}</Text>
                    <Text style={styles.ngoDate}>
                      Applied: {new Date(ngo.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.ngoActions}>
                    <TouchableOpacity
                      style={[styles.ngoBtn, styles.approveBtn]}
                      onPress={() => handleApprove(ngo._id)}
                    >
                      <Text style={styles.ngoBtnText}>✓ Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ngoBtn, styles.rejectBtn]}
                      onPress={() => handleToggleBlock(ngo._id)}
                    >
                      <Text style={[styles.ngoBtnText, { color: colors.danger }]}>✗ Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>No pending NGO requests</Text>
                <Text style={styles.emptySubtext}>All NGO applications have been reviewed</Text>
              </View>
            )}
          </View>

          {/* Approved NGOs */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✅</Text>
            <Text style={styles.sectionTitle}>Approved NGOs ({approvedNGOs.length})</Text>
          </View>

          <View style={styles.sectionCard}>
            {approvedNGOs.length > 0 ? (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  {["Name", "Email", "Joined", "Status", "Actions"].map((h) => (
                    <Text key={h} style={styles.tableHeaderText}>{h}</Text>
                  ))}
                </View>
                {approvedNGOs.map((ngo, i) => (
                  <View key={ngo._id} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                    <View style={styles.cell}>
                      <Text style={styles.cellName}>{ngo.name || "—"}</Text>
                    </View>
                    <View style={styles.cell}>
                      <Text style={styles.cellText} numberOfLines={1}>{ngo.email || "—"}</Text>
                    </View>
                    <View style={styles.cell}>
                      <Text style={styles.cellText}>
                        {ngo.createdAt
                          ? new Date(ngo.createdAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })
                          : "—"}
                      </Text>
                    </View>
                    <View style={styles.cell}>
                      <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                        <Text style={[styles.cellText, { color: colors.success }]}>Approved</Text>
                      </View>
                    </View>
                    <View style={styles.cell}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: `${colors.danger}20` }]}
                        onPress={() => handleToggleBlock(ngo._id)}
                      >
                        <Text style={[styles.actionBtnText, { color: colors.danger }]}>Revoke</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No approved NGOs yet</Text>
              </View>
            )}
          </View>

          <View style={{ height: responsive.showBottomBar ? 80 : 40 }} />
        </ScrollView>

        <MobileBottomBar navigation={navigation} activeKey="AdminNGOApprovals" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: colors.muted, fontSize: 16 },
  layout: { flex: 1 },
  content: { flex: 1 },
  contentContainer: {},
  heading: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subheading: { color: colors.muted, marginBottom: 24, marginTop: 6, fontSize: 15 },

  // Stats
  statsRow: {
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statTitle: { color: colors.muted, fontSize: 13, fontWeight: "500", marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: "800", color: colors.text },

  // Section
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 8 },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: 24,
    overflow: "hidden",
  },

  // NGO rows
  ngoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  ngoRowBorder: { borderBottomWidth: 1, borderColor: `${colors.border}60` },
  ngoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}25`,
    justifyContent: "center",
    alignItems: "center",
  },
  ngoAvatarText: { color: colors.primary, fontSize: 20, fontWeight: "700" },
  ngoInfo: { flex: 1, gap: 2 },
  ngoName: { color: colors.text, fontWeight: "700", fontSize: 16 },
  ngoEmail: { color: colors.muted, fontSize: 13 },
  ngoDate: { color: colors.muted, fontSize: 12, marginTop: 2 },
  ngoActions: { flexDirection: "row", gap: 8 },
  ngoBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  approveBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: `${colors.danger}15`, borderWidth: 1, borderColor: `${colors.danger}40` },
  ngoBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Table
  table: { borderRadius: 10, overflow: "hidden" },
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
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: `${colors.border}60`,
    alignItems: "center",
  },
  tableRowAlt: { backgroundColor: `${colors.bg}40` },
  cell: { flex: 1, justifyContent: "center" },
  cellName: { color: colors.text, fontSize: 14, fontWeight: "600" },
  cellText: { color: colors.text, fontSize: 13 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, alignSelf: "flex-start" },
  actionBtnText: { fontSize: 12, fontWeight: "700" },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: colors.muted, fontSize: 15 },
  emptySubtext: { color: colors.muted, fontSize: 13 },
});
