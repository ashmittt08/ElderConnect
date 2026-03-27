import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import useResponsive from "../hooks/useResponsive";

const colors = {
  sidebar: "#0B1220",
  card: "#1E293B",
  border: "#334155",
  primary: "#4799EB",
  text: "#F1F5F9",
  muted: "#94A3B8",
  bg: "#0F172A",
};

const navItems = [
  { key: "AdminDashboard", label: "Dashboard", shortLabel: "Home", icon: "📊" },
  { key: "AdminUserManagement", label: "User Management", shortLabel: "Users", icon: "👥" },
  { key: "AdminNGOApprovals", label: "NGO Approvals", shortLabel: "NGOs", icon: "✅" },
  { key: "AdminActivityMonitoring", label: "Activity Monitoring", shortLabel: "Activity", icon: "📈" },
  { key: "AdminFlaggedReports", label: "Flagged Reports", shortLabel: "Reports", icon: "🚩" },
];

function navigateTo(navigation, key, activeKey) {
  if (key !== activeKey) {
    if (key === "AdminDashboard") {
      navigation.popToTop?.() || navigation.navigate("AdminDashboard");
    } else {
      navigation.navigate(key);
    }
  }
}

/* ── Desktop Sidebar ── */
export default function AdminSidebar({ navigation, activeKey }) {
  const { showSidebar } = useResponsive();
  if (!showSidebar) return null;

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.logo}>ElderConnect</Text>
        <Text style={styles.hub}>Admin Panel</Text>
      </View>
      <View style={styles.sidebarNav}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => navigateTo(navigation, item.key, activeKey)}
            style={[styles.sidebarItem, activeKey === item.key && styles.sidebarItemActive]}
          >
            <Text style={styles.sidebarIcon}>{item.icon}</Text>
            <Text style={[styles.sidebarText, activeKey === item.key && styles.sidebarTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/* ── Mobile / Tablet Bottom Bar ── */
export function MobileBottomBar({ navigation, activeKey }) {
  const { showBottomBar } = useResponsive();
  if (!showBottomBar) return null;

  return (
    <View style={styles.bottomBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bottomBarContent}
      >
        {navItems.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => navigateTo(navigation, item.key, activeKey)}
              style={[styles.bottomTab, isActive && styles.bottomTabActive]}
            >
              <Text style={[styles.bottomTabIcon, isActive && styles.bottomTabIconActive]}>
                {item.icon}
              </Text>
              <Text style={[styles.bottomTabLabel, isActive && styles.bottomTabLabelActive]}>
                {item.shortLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Sidebar ── */
  sidebar: {
    width: 260,
    backgroundColor: colors.sidebar,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  sidebarHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  logo: { fontSize: 22, fontWeight: "800", color: colors.primary, letterSpacing: 0.5 },
  hub: { color: colors.muted, marginTop: 4, fontSize: 13 },
  sidebarNav: { padding: 12 },
  sidebarItem: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderRadius: 10, marginBottom: 4, gap: 12,
  },
  sidebarItemActive: {
    backgroundColor: `${colors.primary}18`,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  sidebarIcon: { fontSize: 18 },
  sidebarText: { color: colors.muted, fontSize: 14, fontWeight: "500" },
  sidebarTextActive: { color: colors.primary, fontWeight: "600" },

  /* ── Bottom Bar ── */
  bottomBar: {
    backgroundColor: colors.sidebar,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 4,
  },
  bottomBarContent: { flexDirection: "row", paddingHorizontal: 4 },
  bottomTab: {
    flex: 1, minWidth: 70, alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: 8, marginHorizontal: 2, marginTop: 4,
  },
  bottomTabActive: { backgroundColor: `${colors.primary}18` },
  bottomTabIcon: { fontSize: 20, marginBottom: 3 },
  bottomTabIconActive: { fontSize: 22 },
  bottomTabLabel: { color: colors.muted, fontSize: 10, fontWeight: "600", textAlign: "center" },
  bottomTabLabelActive: { color: colors.primary, fontWeight: "700" },
});
