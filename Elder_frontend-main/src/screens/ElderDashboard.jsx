import { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import api from "../api";
import ElderSidebar, { ElderMobileBottomBar } from "../components/ElderSidebar";
import useResponsive from "../hooks/useResponsive";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#4799EB",
  primaryDark: "#2563EB",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function ElderDashboard({ navigation }) {
  const { user } = useContext(AuthContext);
  const responsive = useResponsive();

  const [requests, setRequests] = useState([]);
  const [nearestNGOs, setNearestNGOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const [reqsRes, ngosRes] = await Promise.all([
        api.get("/elder/requests"),
        api.get("/elder/nearest-ngos"),
      ]);
      setRequests(reqsRes.data);
      setNearestNGOs(ngosRes.data);
    } catch (err) {
      console.error("ELDER DASHBOARD ERROR:", err.response?.data || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
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

  const pendingCount = requests.filter((r) => r.status?.toLowerCase() === "pending").length;
  const completedCount = requests.filter((r) => r.status?.toLowerCase() === "completed").length;
  const assignedCount = requests.filter((r) => r.status?.toLowerCase() === "assigned").length;

  const recent = [...requests]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}>
        <ElderSidebar navigation={navigation} activeKey="ElderDashboard" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { padding: responsive.contentPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <Text style={styles.heading}>
            Welcome back, {user?.name || "Elder"}
          </Text>
          <Text style={styles.subheading}>
            Manage your requests and health information
          </Text>

          {/* Stat Cards */}
          <View style={[styles.statsRow, { flexDirection: responsive.isMobile ? "column" : "row", flexWrap: responsive.isTablet ? "wrap" : "nowrap" }]}>
            <StatCard
              title="Total Requests"
              value={requests.length}
              color={colors.primary}
            />
            <StatCard
              title="Pending"
              value={pendingCount}
              color={colors.warning}
            />
            <StatCard
              title="Assigned"
              value={assignedCount}
              color={colors.primary}
            />
            <StatCard
              title="Completed"
              value={completedCount}
              color={colors.success}
            />
          </View>

          {/* Quick Actions */}
          <SectionHeader title="Quick Actions" icon="⚡" />
          <View style={[styles.actionsRow, { flexDirection: responsive.isMobile ? "column" : "row", flexWrap: "wrap" }]}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("CreateRequest", { type: "medicine" })}
            >
              <Text style={styles.actionIcon}>💊</Text>
              <Text style={styles.actionTitle}>Medicine Request</Text>
              <Text style={styles.actionDesc}>Request medicine drop-off</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("DeliveryOrderScreen")}
            >
              <Text style={styles.actionIcon}>🚚</Text>
              <Text style={styles.actionTitle}>Order Delivery</Text>
              <Text style={styles.actionDesc}>Medicine & grocery delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("CompanionScreen")}
            >
              <Text style={styles.actionIcon}>🤖</Text>
              <Text style={styles.actionTitle}>AI Companion</Text>
              <Text style={styles.actionDesc}>Friendly chat & help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("DeliveryHistoryScreen")}
            >
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionTitle}>Track Deliveries</Text>
              <Text style={styles.actionDesc}>Track your active orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MyRequests")}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionTitle}>My Requests</Text>
              <Text style={styles.actionDesc}>View all your requests</Text>
            </TouchableOpacity>
          </View>

          {/* Nearest Old Age Homes */}
          <SectionHeader title="Nearest Support & Old Age Homes" icon="🏥" />
          <View style={styles.ngoList}>
            {nearestNGOs.length > 0 ? (
              nearestNGOs.map((ngo) => (
                <View key={ngo._id} style={styles.ngoCard}>
                  <View style={styles.ngoAvatar}>
                    {ngo.profilePhoto ? (
                      <Image source={{ uri: ngo.profilePhoto }} style={styles.ngoImage} />
                    ) : (
                      <Text style={styles.ngoAvatarText}>{ngo.name?.charAt(0)?.toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.ngoInfo}>
                    <Text style={styles.ngoName}>{ngo.name}</Text>
                    <Text style={styles.ngoAddress}>📍 {ngo.address || "Address not provided"}</Text>
                    {ngo.phone && <Text style={styles.ngoPhone}>📞 {ngo.phone}</Text>}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={styles.emptyText}>No nearby homes found yet.</Text>
              </View>
            )}
          </View>

          {/* Recent Activity */}
          <SectionHeader title="Recent Activity" icon="🕐" />
          <View style={styles.sectionCard}>
            {recent.length > 0 ? (
              <Table
                headers={["Type", "Description", "Status", "Date"]}
                rows={recent.map((r) => ({
                  cells: [
                    r.type?.charAt(0).toUpperCase() + r.type?.slice(1) || "—",
                    r.description?.substring(0, 40) + (r.description?.length > 40 ? "…" : "") || "—",
                    r.status?.charAt(0).toUpperCase() + r.status?.slice(1) || "—",
                    new Date(r.updatedAt).toLocaleDateString(),
                  ],
                  statusColor:
                    r.status?.toLowerCase() === "completed"
                      ? colors.success
                      : r.status?.toLowerCase() === "assigned"
                      ? colors.primary
                      : colors.warning,
                }))}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No requests yet. Create one to get started!</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("MyRequests")}
            >
              <Text style={styles.viewAllText}>View All Requests →</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom padding */}
          <View style={{ height: responsive.showBottomBar ? 80 : 40 }} />
        </ScrollView>

        <ElderMobileBottomBar navigation={navigation} activeKey="ElderDashboard" />
      </View>
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

const StatCard = ({ title, value, color }) => (
  <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{typeof value === "number" ? value.toLocaleString() : value}</Text>
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
            {j === 2 && row.statusColor ? (
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

  layout: { flex: 1 },

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
  },

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

  // Action cards
  actionsRow: {
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 8,
  },
  actionIcon: { fontSize: 32 },
  actionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  actionDesc: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
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

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: colors.muted, fontSize: 15 },
  emptyStateContainer: { alignItems: "center", paddingVertical: 20 },

  // NGO Card Styles
  ngoList: { gap: 14, marginBottom: 32 },
  ngoCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: "center",
  },
  ngoAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}25`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  ngoImage: { width: "100%", height: "100%" },
  ngoAvatarText: { color: colors.primary, fontSize: 24, fontWeight: "bold" },
  ngoInfo: { flex: 1, gap: 4 },
  ngoName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  ngoAddress: { color: colors.muted, fontSize: 13 },
  ngoPhone: { color: colors.success, fontSize: 13, fontWeight: "600", marginTop: 2 },
});
