import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
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

export default function AdminUserManagement({ navigation }) {
  const responsive = useResponsive();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("FETCH USERS ERROR:", err.response?.data || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleBlock = async (id, currentStatus) => {
    try {
      await api.post(`/admin/toggle-block/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("TOGGLE BLOCK ERROR:", err.response?.data || err);
    }
  };

  const handleDelete = async (id, name) => {
    if (Platform.OS === "web") {
      if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    } else {
      Alert.alert("Confirm Delete", `Delete user "${name}"? This cannot be undone.`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => doDelete(id) },
      ]);
      return;
    }
    doDelete(id);
  };

  const doDelete = async (id) => {
    try {
      await api.delete(`/admin/delete/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("DELETE USER ERROR:", err.response?.data || err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    all: users.length,
    elder: users.filter((u) => u.role === "elder").length,
    volunteer: users.filter((u) => u.role === "volunteer").length,
    ngo: users.filter((u) => u.role === "ngo").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}>
        <AdminSidebar navigation={navigation} activeKey="AdminUserManagement" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { padding: responsive.contentPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          <Text style={styles.heading}>User Management</Text>
          <Text style={styles.subheading}>
            Manage all platform users • {users.length} total users
          </Text>

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {/* Role Filter Tabs */}
          <View style={styles.filterRow}>
            {["all", "elder", "volunteer", "ngo", "admin"].map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.filterTab,
                  roleFilter === role && styles.filterTabActive,
                ]}
                onPress={() => setRoleFilter(role)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    roleFilter === role && styles.filterTabTextActive,
                  ]}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)} ({roleCounts[role]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Users Table */}
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              {["Name", "Email", "Role", "Status", "Verified", "Actions"].map((h, i) => (
                <Text
                  key={i}
                  style={[
                    styles.tableHeaderText,
                    i === 5 && { flex: 1.5 },
                  ]}
                >
                  {h}
                </Text>
              ))}
            </View>

            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👤</Text>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : (
              filteredUsers.map((u, i) => (
                <View key={u._id} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                  <View style={styles.cell}>
                    <Text style={styles.cellName}>{u.name || "—"}</Text>
                  </View>
                  <View style={styles.cell}>
                    <Text style={styles.cellText} numberOfLines={1}>{u.email || "—"}</Text>
                  </View>
                  <View style={styles.cell}>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(u.role) + "20" }]}>
                      <Text style={[styles.roleBadgeText, { color: getRoleColor(u.role) }]}>
                        {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cell}>
                    <View style={styles.statusCellContainer}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: u.approved ? colors.success : colors.danger },
                        ]}
                      />
                      <Text
                        style={[
                          styles.cellText,
                          { color: u.approved ? colors.success : colors.danger },
                        ]}
                      >
                        {u.approved ? "Active" : "Blocked"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cell}>
                    <Text
                      style={[
                        styles.cellText,
                        {
                          color:
                            u.verification?.status === "verified"
                              ? colors.success
                              : u.verification?.status === "pending"
                              ? colors.warning
                              : colors.muted,
                        },
                      ]}
                    >
                      {u.verification?.status
                        ? u.verification.status.charAt(0).toUpperCase() +
                          u.verification.status.slice(1)
                        : "None"}
                    </Text>
                  </View>
                  <View style={[styles.cell, { flex: 1.5 }]}>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          {
                            backgroundColor: u.approved
                              ? `${colors.warning}20`
                              : `${colors.success}20`,
                          },
                        ]}
                        onPress={() => handleToggleBlock(u._id, u.approved)}
                      >
                        <Text
                          style={[
                            styles.actionBtnText,
                            { color: u.approved ? colors.warning : colors.success },
                          ]}
                        >
                          {u.approved ? "Block" : "Unblock"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: `${colors.danger}20` }]}
                        onPress={() => handleDelete(u._id, u.name)}
                      >
                        <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: responsive.showBottomBar ? 80 : 40 }} />
        </ScrollView>

        <MobileBottomBar navigation={navigation} activeKey="AdminUserManagement" />
      </View>
    </SafeAreaView>
  );
}

function getRoleColor(role) {
  switch (role) {
    case "elder": return "#F59E0B";
    case "volunteer": return "#22C55E";
    case "ngo": return "#4799EB";
    case "admin": return "#EF4444";
    default: return "#94A3B8";
  }
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

  // Search
  searchRow: { marginBottom: 16 },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 14,
    outlineStyle: "none",
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  filterTabText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  filterTabTextActive: { color: colors.primary },

  // Table
  tableCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
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

  // Status
  statusCellContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // Role badge
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },

  // Actions
  actionsRow: { flexDirection: "row", gap: 6 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { fontSize: 12, fontWeight: "700" },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: colors.muted, fontSize: 15 },
});
