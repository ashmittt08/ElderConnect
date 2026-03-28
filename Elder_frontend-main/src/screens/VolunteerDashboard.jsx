import { useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { auth } from "../config/firebase";
import { useFocusEffect } from "@react-navigation/native";
import useResponsive from "../hooks/useResponsive";

const colors = {
  bg: "#0F172A",
  sidebar: "#0B1220",
  card: "#1E293B",
  border: "#334155",
  primary: "#3B82F6",
  green: "#16A34A",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function VolunteerDashboard({ navigation }) {
  const { user } = useContext(AuthContext);

  const [available, setAvailable] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const responsive = useResponsive();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchDashboard = async () => {
        try {
          const token = await auth.currentUser.getIdToken();
          const headers = { Authorization: `Bearer ${token}` };

          const [availableRes, tasksRes, deliveriesRes, activeRes, historyRes] = await Promise.all([
            axios.get("http://localhost:5000/volunteer/requests", { headers }),
            axios.get("http://localhost:5000/volunteer/tasks", { headers }),
            axios.get("http://localhost:5000/delivery/available", { headers }),
            axios.get("http://localhost:5000/delivery/active", { headers }),
            axios.get("http://localhost:5000/delivery/history", { headers }),
          ]);

          if (isActive) {
            setAvailable(availableRes.data);
            setDeliveries(deliveriesRes.data);
            setActiveDelivery(activeRes.data);

            const completedRegular = tasksRes.data
              .filter((t) => t.status?.toLowerCase() === "completed")
              .map((t) => ({ ...t, displayType: t.type }));

            const completedDeliveries = historyRes.data
              .map((d) => ({
                _id: d._id,
                displayType: d.category === "medicine" ? "Medicine Delivery" : "Grocery Delivery",
                description: `Delivered to ${d.elder?.name || "Elder"} at ${d.deliveryAddress}`,
                status: d.status,
                updatedAt: d.updatedAt,
              }));

            const completedTasks = [...completedRegular, ...completedDeliveries]
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setCompleted(completedTasks);
          }
        } catch (err) {
          console.log("DASHBOARD ERROR:", err.response?.data || err);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchDashboard();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const acceptDelivery = async (deliveryId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        `http://localhost:5000/delivery/accept/${deliveryId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigation.navigate("VolunteerActiveDelivery", { orderId: deliveryId });
    } catch (err) {
      console.error("ACCEPT DELIVERY ERROR:", err);
      const msg = "Failed to accept delivery";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Error", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}>
        {/* Sidebar */}
        {responsive.showSidebar && (
          <View style={styles.sidebar}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                {user?.profilePhoto ? (
                  <Image 
                    source={{ uri: user.profilePhoto }} 
                    style={{ width: "100%", height: "100%", borderRadius: 30 }} 
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </Text>
                )}
              </View>

              <Text style={styles.profileName}>
                {user?.name || "Volunteer"}
              </Text>

              <Text style={styles.profileRole}>
                {user?.role?.toUpperCase() || "VOLUNTEER"}
              </Text>
            </View>

            <SidebarItem label="Dashboard" active />
            <SidebarItem
              label="Requests"
              onPress={() => navigation.navigate("AvailableRequests")}
            />
            <SidebarItem
              label="My Tasks"
              onPress={() => navigation.navigate("MyTasks")}
            />
            <SidebarItem
              label="Partner NGOs"
              onPress={() => navigation.navigate("NGOsScreen")}
            />
            <SidebarItem
              label="Events"
              onPress={() => navigation.navigate("EventsScreen")}
            />
            {activeDelivery && (
              <SidebarItem
                label="🚚 Active Delivery"
                onPress={() =>
                  navigation.navigate("VolunteerActiveDelivery", {
                    orderId: activeDelivery._id,
                  })
                }
              />
            )}
          </View>
        )}

        {/* Main Content */}
        <ScrollView style={styles.content}>
          <Text style={styles.heading}>Dashboard</Text>
          <Text style={styles.subheading}>
            Manage your activities and performance
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              {/* Stats */}
              <View style={[styles.statsRow, { flexDirection: responsive.isMobile ? "column" : "row" }]}>
                <StatCard
                  title="Available Tasks"
                  value={available.length}
                  color={colors.primary}
                  onPress={() => navigation.navigate("AvailableRequests")}
                />
                <StatCard
                  title="Completed Tasks"
                  value={completed.length}
                  color={colors.green}
                  onPress={() => navigation.navigate("MyTasks")}
                />
                <StatCard
                  title="Pending Deliveries"
                  value={deliveries.length}
                  color="#F59E0B"
                />
              </View>

              {/* Active Delivery Banner */}
              {activeDelivery && (
                <TouchableOpacity
                  style={styles.activeDeliveryBanner}
                  onPress={() =>
                    navigation.navigate("VolunteerActiveDelivery", {
                      orderId: activeDelivery._id,
                    })
                  }
                >
                  <View style={styles.activeBannerLeft}>
                    <Text style={styles.activeBannerIcon}>🚚</Text>
                    <View>
                      <Text style={styles.activeBannerTitle}>Active Delivery</Text>
                      <Text style={styles.activeBannerDesc}>
                        {activeDelivery.category === "medicine" ? "💊 Medicine" : "🛒 Grocery"} •{" "}
                        {activeDelivery.items?.length} items • {activeDelivery.status?.replace(/_/g, " ")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activeBannerArrow}>→</Text>
                </TouchableOpacity>
              )}

              {/* Available Deliveries */}
              {deliveries.length > 0 && (
                <>
                  <SectionTitle title="🚚 Available Deliveries" />
                  {deliveries.slice(0, 5).map((delivery) => (
                    <View key={delivery._id} style={styles.deliveryCard}>
                      <View style={styles.deliveryCardHeader}>
                        <Text style={styles.deliveryCategory}>
                          {delivery.category === "medicine" ? "💊 Medicine" : "🛒 Grocery"}
                        </Text>
                        <Text style={styles.deliveryItemCount}>
                          {delivery.items?.length} items
                          {delivery.items?.some((i) => i.urgent) && " · ⚡ Urgent"}
                        </Text>
                      </View>
                      <Text style={styles.deliveryAddress} numberOfLines={1}>
                        📍 {delivery.deliveryAddress}
                      </Text>
                      {delivery.elder && (
                        <Text style={styles.deliveryElder}>
                          👤 {delivery.elder.name}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={styles.acceptDeliveryBtn}
                        onPress={() => acceptDelivery(delivery._id)}
                      >
                        <Text style={styles.acceptDeliveryText}>Accept Delivery →</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              {/* Quick Actions */}
              <SectionTitle title="Quick Actions" />

              {available.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.quickCard}
                  onPress={() => navigation.navigate("AvailableRequests")}
                >
                  <Text style={styles.quickTitle}>
                    {item.type?.toUpperCase()}
                  </Text>
                  <Text style={styles.quickDesc}>{item.description}</Text>
                </TouchableOpacity>
              ))}

              {available.length === 0 && (
                <Text style={{ color: colors.muted }}>
                  No available requests.
                </Text>
              )}

              {/* Recent Activity */}
              <SectionTitle title="Recent Activity" />

              {completed.slice(0, 3).map((item) => (
                <View key={item._id} style={styles.activityCard}>
                  <Text style={styles.activityTitle}>
                    {item.displayType?.toUpperCase() || item.type?.toUpperCase()}
                  </Text>
                  <Text style={styles.activityDesc}>{item.description}</Text>
                  <Text style={styles.activityStatus}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              ))}

              {completed.length === 0 && (
                <Text style={{ color: colors.muted }}>
                  No completed tasks yet.
                </Text>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const SidebarItem = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.sidebarItem, active && { backgroundColor: colors.card }]}
    onPress={onPress}
  >
    <Text style={styles.sidebarText}>{label}</Text>
  </TouchableOpacity>
);

const StatCard = ({ title, value, color, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderColor: color }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.statNumber}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const SectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  layout: {
    flexDirection: "row", // Overridden dynamically below but keeping base as row for styling purposes
    flex: 1,
  },

  sidebar: {
    width: 250,
    backgroundColor: colors.sidebar,
    padding: 20,
  },

  profileSection: {
    marginBottom: 30,
    alignItems: "center",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    marginBottom: 10,
  },

  profileName: {
    color: colors.text,
    fontWeight: "bold",
  },

  profileRole: {
    color: colors.muted,
    fontSize: 13,
  },

  sidebarItem: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },

  sidebarText: {
    color: colors.text,
  },

  content: {
    flex: 1,
    padding: 24,
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },

  subheading: {
    color: colors.muted,
    marginBottom: 30,
  },

  statsRow: {
    flexDirection: "row", // we will override inline
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: colors.text,
  },

  statTitle: {
    marginTop: 8,
    color: colors.muted,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 15,
  },

  quickCard: {
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  quickTitle: {
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 5,
  },

  quickDesc: {
    color: colors.muted,
  },

  activityCard: {
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  activityTitle: {
    color: colors.green,
    fontWeight: "bold",
    marginBottom: 5,
  },

  activityDesc: {
    color: colors.muted,
  },

  activityStatus: {
    marginTop: 6,
    color: colors.green,
    fontSize: 12,
  },

  // Delivery styles
  activeDeliveryBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary + "15",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 16,
    marginBottom: 20,
  },
  activeBannerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  activeBannerIcon: { fontSize: 28 },
  activeBannerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  activeBannerDesc: { fontSize: 13, color: colors.muted, marginTop: 2 },
  activeBannerArrow: { fontSize: 20, color: colors.primary, fontWeight: "700" },

  deliveryCard: {
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deliveryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deliveryCategory: { color: colors.primary, fontWeight: "bold", fontSize: 14 },
  deliveryItemCount: { color: colors.muted, fontSize: 12 },
  deliveryAddress: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  deliveryElder: { color: colors.text, fontSize: 13, marginBottom: 10 },
  acceptDeliveryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptDeliveryText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
});
