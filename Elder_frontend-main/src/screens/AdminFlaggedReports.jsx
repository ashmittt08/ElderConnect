import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminSidebar, { MobileBottomBar } from "../components/AdminSidebar";
import useResponsive from "../hooks/useResponsive";
import api from "../api";

const colors = {
  bg: "#0F172A", card: "#1E293B", border: "#334155", primary: "#4799EB",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444", text: "#F1F5F9", muted: "#94A3B8",
};

export default function AdminFlaggedReports({ navigation }) {
  const responsive = useResponsive();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get("/admin/verifications");
      setReports(res.data);
    } catch (err) {
      console.error("FLAGGED REPORTS ERROR:", err.response?.data || err);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  const onRefresh = () => { setRefreshing(true); fetchReports(); };

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/admin/verify-user/${id}`, { status });
      fetchReports();
    } catch (err) {
      console.error("VERIFY ERROR:", err.response?.data || err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading Reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={[s.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}>
        <AdminSidebar navigation={navigation} activeKey="AdminFlaggedReports" />
        <ScrollView style={s.content} contentContainerStyle={[s.cc, { padding: responsive.contentPadding }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

          <Text style={s.heading}>Flagged Reports</Text>
          <Text style={s.sub}>Review pending identity verifications from platform users</Text>

          {/* Stats */}
          <View style={[s.statsRow, { flexDirection: responsive.isMobile ? "column" : "row" }]}>
            <View style={[s.statCard, { borderTopColor: colors.warning, borderTopWidth: 3 }]}>
              <Text style={s.statLabel}>Pending Reviews</Text>
              <Text style={s.statBig}>{reports.length}</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: colors.danger, borderTopWidth: 3 }]}>
              <Text style={s.statLabel}>Needs Attention</Text>
              <Text style={s.statBig}>{reports.length > 0 ? "Yes" : "No"}</Text>
            </View>
          </View>

          {/* Reports List */}
          <View style={s.sectionH}>
            <Text style={s.sectionI}>🚩</Text>
            <Text style={s.sectionT}>Pending Verifications ({reports.length})</Text>
          </View>

          {reports.length > 0 ? (
            reports.map((report, i) => (
              <View key={report._id} style={s.reportCard}>
                {/* Header */}
                <View style={s.reportHeader}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{report.name?.charAt(0)?.toUpperCase() || "?"}</Text>
                  </View>
                  <View style={s.reportInfo}>
                    <Text style={s.reportName}>{report.name}</Text>
                    <Text style={s.reportEmail}>{report.email}</Text>
                  </View>
                  <View style={[s.roleBadge, { backgroundColor: getRoleColor(report.role) + "20" }]}>
                    <Text style={[s.roleBadgeText, { color: getRoleColor(report.role) }]}>
                      {report.role?.charAt(0).toUpperCase() + report.role?.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Verification Details */}
                <View style={s.detailsGrid}>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>ID Type</Text>
                    <Text style={s.detailValue}>{report.verification?.idType || "Not specified"}</Text>
                  </View>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>Status</Text>
                    <View style={s.statusBadge}>
                      <View style={[s.statusDot, { backgroundColor: colors.warning }]} />
                      <Text style={[s.detailValue, { color: colors.warning }]}>Pending</Text>
                    </View>
                  </View>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>Submitted</Text>
                    <Text style={s.detailValue}>
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : "Unknown"}
                    </Text>
                  </View>
                </View>

                {/* ID Document Links */}
                {(report.verification?.idFrontUrl || report.verification?.idBackUrl || report.verification?.selfieUrl) && (
                  <View style={s.documentsRow}>
                    <Text style={s.documentsLabel}>📎 Documents Submitted:</Text>
                    <View style={s.docBadges}>
                      {report.verification?.idFrontUrl && <View style={s.docBadge}><Text style={s.docBadgeText}>ID Front</Text></View>}
                      {report.verification?.idBackUrl && <View style={s.docBadge}><Text style={s.docBadgeText}>ID Back</Text></View>}
                      {report.verification?.selfieUrl && <View style={s.docBadge}><Text style={s.docBadgeText}>Selfie</Text></View>}
                    </View>
                  </View>
                )}

                {/* Actions */}
                <View style={s.actionsRow}>
                  <TouchableOpacity style={[s.actionBtn, s.verifyBtn]} onPress={() => handleVerify(report._id, "verified")}>
                    <Text style={s.actionBtnText}>✓ Verify User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.rejectBtn]} onPress={() => handleVerify(report._id, "rejected")}>
                    <Text style={[s.actionBtnText, { color: colors.danger }]}>✗ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>🎉</Text>
              <Text style={s.emptyTitle}>All Clear!</Text>
              <Text style={s.emptyText}>No pending verification reports to review</Text>
            </View>
          )}

          <View style={{ height: responsive.showBottomBar ? 80 : 40 }} />
        </ScrollView>

        <MobileBottomBar navigation={navigation} activeKey="AdminFlaggedReports" />
      </View>
    </SafeAreaView>
  );
}

function getRoleColor(role) {
  switch (role) { case "elder": return "#F59E0B"; case "volunteer": return "#22C55E"; case "ngo": return "#4799EB"; case "admin": return "#EF4444"; default: return "#94A3B8"; }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: colors.muted, fontSize: 16 },
  layout: { flex: 1 },
  content: { flex: 1 }, cc: {},
  heading: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  sub: { color: colors.muted, marginBottom: 24, marginTop: 6, fontSize: 15 },

  statsRow: { gap: 16, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: colors.card, padding: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  statLabel: { color: colors.muted, fontSize: 13, fontWeight: "500", marginBottom: 8 },
  statBig: { fontSize: 32, fontWeight: "800", color: colors.text },

  sectionH: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionI: { fontSize: 22 },
  sectionT: { fontSize: 20, fontWeight: "700", color: colors.text },

  reportCard: {
    backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 24, marginBottom: 16,
  },
  reportHeader: {
    flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20,
    paddingBottom: 16, borderBottomWidth: 1, borderColor: `${colors.border}60`,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.primary}25`,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: colors.primary, fontSize: 20, fontWeight: "700" },
  reportInfo: { flex: 1, gap: 2 },
  reportName: { color: colors.text, fontWeight: "700", fontSize: 17 },
  reportEmail: { color: colors.muted, fontSize: 13 },

  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },

  detailsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 16,
  },
  detailItem: { flex: 1, gap: 4 },
  detailLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { color: colors.text, fontSize: 14, fontWeight: "500" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  documentsRow: { marginBottom: 20, gap: 8 },
  documentsLabel: { color: colors.muted, fontSize: 13 },
  docBadges: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  docBadge: { backgroundColor: `${colors.primary}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: `${colors.primary}30` },
  docBadgeText: { color: colors.primary, fontSize: 12, fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  verifyBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: `${colors.danger}15`, borderWidth: 1, borderColor: `${colors.danger}40` },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  emptyCard: {
    backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 48, alignItems: "center", gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  emptyText: { color: colors.muted, fontSize: 15 },
});
