import { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import useResponsive from "../hooks/useResponsive";
import { AuthContext } from "../context/AuthContext";

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
  { key: "ElderDashboard", label: "Dashboard", shortLabel: "Home", icon: "🏠" },
  { key: "CreateRequest", label: "Create Request", shortLabel: "Request", icon: "📝" },
  { key: "MyRequests", label: "My Requests", shortLabel: "Requests", icon: "📋" },
  { key: "DeliveryOrderScreen", label: "Deliveries", shortLabel: "Deliver", icon: "🚚" },
  { key: "DeliveryHistoryScreen", label: "Track Orders", shortLabel: "Track", icon: "📍" },
  { key: "NGOsScreen", label: "Partner NGOs", shortLabel: "NGOs", icon: "🤝" },
  { key: "MyNGOsScreen", label: "My NGOs", shortLabel: "My NGOs", icon: "🏢" },
  { key: "EventsScreen", label: "Events", shortLabel: "Events", icon: "📅" },
];

function navigateTo(navigation, key, activeKey) {
  if (key !== activeKey) {
    if (key === "ElderDashboard") {
      navigation.popToTop?.() || navigation.navigate("ElderDashboard");
    } else {
      navigation.navigate(key);
    }
  }
}

/* ── Desktop Sidebar ── */
export default function ElderSidebar({ navigation, activeKey }) {
  const { showSidebar } = useResponsive();
  const { user } = useContext(AuthContext);

  if (!showSidebar) return null;

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.logo}>ElderConnect</Text>
        <Text style={styles.hub}>Elder Hub</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          {user?.profilePhoto ? (
            <Image 
              source={{ uri: user.profilePhoto }} 
              style={{ width: "100%", height: "100%", borderRadius: 25 }} 
            />
          ) : (
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>{user?.name || "Elder"}</Text>
          <Text style={styles.profileRole}>Elder</Text>
        </View>
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
export function ElderMobileBottomBar({ navigation, activeKey }) {
  const { showBottomBar } = useResponsive();
  if (!showBottomBar) return null;

  return (
    <View style={styles.bottomBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bottomBarContent}
      >
        {/* Render first 3 nav items: Home, Request, Requests */}
        {navItems.slice(0, 3).map((item) => {
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

        {/* Centerpiece: Deliver (New Order) */}
        <TouchableOpacity
          onPress={() => navigation.navigate("DeliveryOrderScreen")}
          style={[
            styles.bottomTab, 
            { 
              backgroundColor: '#F97316', 
              borderRadius: 14, 
              marginVertical: 4, 
              paddingHorizontal: 16,
              minWidth: 80,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5
            },
            activeKey === "DeliveryOrderScreen" && { borderWidth: 2, borderColor: '#FFF' }
          ]}
        >
          <Text style={[styles.bottomTabIcon, { fontSize: 24 }]}>🚚</Text>
          <Text style={[styles.bottomTabLabel, { color: '#FFF', fontWeight: '800' }]}>Deliver</Text>
        </TouchableOpacity>

        {/* Primary Action: Track (History) */}
        <TouchableOpacity
          onPress={() => navigation.navigate("DeliveryHistoryScreen")}
          style={[
            styles.bottomTab,
            activeKey === "DeliveryHistoryScreen" && styles.bottomTabActive
          ]}
        >
          <Text style={[styles.bottomTabIcon, activeKey === "DeliveryHistoryScreen" && styles.bottomTabIconActive]}>📍</Text>
          <Text style={[styles.bottomTabLabel, activeKey === "DeliveryHistoryScreen" && styles.bottomTabLabelActive]}>Track</Text>
        </TouchableOpacity>

        {/* Render remaining nav items: NGOs, Events */}
        {navItems.slice(5).map((item) => {
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
  
  profileSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, color: colors.text, fontWeight: "bold" },
  profileInfo: { flex: 1 },
  profileName: { color: colors.text, fontWeight: "bold", fontSize: 15, marginBottom: 2 },
  profileRole: { color: colors.muted, fontSize: 12 },

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
