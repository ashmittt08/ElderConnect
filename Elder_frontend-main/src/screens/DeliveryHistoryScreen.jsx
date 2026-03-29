import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api";
import ElderSidebar, { ElderMobileBottomBar } from "../components/ElderSidebar";
import useResponsive from "../hooks/useResponsive";

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
  medicine: "#8B5CF6",
  grocery: "#10B981",
};

const statusColors = {
  pending: colors.warning,
  accepted: colors.primary,
  picked_up: colors.primary,
  out_for_delivery: colors.warning,
  delivered: colors.success,
  cancelled: colors.danger,
};

const statusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function DeliveryHistoryScreen({ navigation }) {
  const responsive = useResponsive();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, medicine, grocery

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get("/delivery/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("FETCH DELIVERY HISTORY ERROR:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleDeleteOrder = (orderId) => {
    const title = "Delete Order";
    const message = "Are you sure you want to remove this order from your history? This action cannot be undone.";

    if (Platform.OS === 'web') {
      const confirm = window.confirm(`${title}\n\n${message}`);
      if (confirm) {
        performDelete(orderId);
      }
    } else {
      Alert.alert(
        title,
        message,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => performDelete(orderId) }
        ]
      );
    }
  };

  const performDelete = async (orderId) => {
    try {
      await api.delete(`/delivery/order/${orderId}`);
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (err) {
      console.error("DELETE ORDER ERROR:", err);
      const errorMsg = err.response?.data?.message || "Failed to delete order";
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert("Error", errorMsg);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.category === filter);

  const activeOrders = filtered.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  );
  const pastOrders = filtered.filter((o) =>
    ["delivered", "cancelled"].includes(o.status)
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[styles.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}
      >
        <ElderSidebar navigation={navigation} activeKey="DeliveryHistoryScreen" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentInner, { padding: responsive.contentPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <Text style={styles.heading}>My Deliveries</Text>
          <Text style={styles.subheading}>Track and manage your delivery orders</Text>

          {/* Filter Tabs */}
          <View style={styles.filterRow}>
            {[
              { key: "all", label: "All", icon: "📋" },
              { key: "medicine", label: "Medicine", icon: "💊" },
              { key: "grocery", label: "Grocery", icon: "🛒" },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={styles.filterIcon}>{f.icon}</Text>
                <Text
                  style={[styles.filterText, filter === f.key && styles.filterTextActive]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { flexDirection: responsive.isMobile ? "column" : "row" }]}>
            <StatCard title="Total Orders" value={filtered.length} color={colors.primary} />
            <StatCard title="Active" value={activeOrders.length} color={colors.warning} />
            <StatCard title="Delivered" value={pastOrders.filter((o) => o.status === "delivered").length} color={colors.success} />
          </View>

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <>
              <SectionHeader title="Active Deliveries" icon="🚚" count={activeOrders.length} />
              {activeOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onPress={() =>
                    navigation.navigate("DeliveryTrackingScreen", { orderId: order._id })
                  }
                  isActive
                />
              ))}
            </>
          )}

          {/* Past Orders */}
          {pastOrders.length > 0 && (
            <>
              <SectionHeader title="Past Orders" icon="📦" count={pastOrders.length} />
              {pastOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onPress={() =>
                    navigation.navigate("DeliveryTrackingScreen", { orderId: order._id })
                  }
                  onDelete={() => handleDeleteOrder(order._id)}
                />
              ))}
            </>
          )}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No delivery orders yet</Text>
              <TouchableOpacity
                style={styles.orderBtn}
                onPress={() => navigation.navigate("DeliveryOrderScreen")}
              >
                <Text style={styles.orderBtnText}>Place Your First Order</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: responsive.showBottomBar ? 80 : 40 }} />
        </ScrollView>

        <ElderMobileBottomBar navigation={navigation} activeKey="DeliveryHistoryScreen" />
      </View>
    </SafeAreaView>
  );
}

/* ── Sub Components ── */

const SectionHeader = ({ title, icon, count }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionIcon}>{icon}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.countBadge}>
      <Text style={styles.countText}>{count}</Text>
    </View>
  </View>
);

const StatCard = ({ title, value, color }) => (
  <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const OrderCard = ({ order, onPress, onDelete, isActive }) => {
  const statusColor = statusColors[order.status] || colors.muted;
  const itemCount = order.items?.length || 0;
  const urgentCount = order.items?.filter((i) => i.urgent).length || 0;

  return (
    <View style={[styles.orderCard, isActive && styles.orderCardActive]}>
      {/* Main Touchable part of the card */}
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7}
        style={styles.orderCardClickable}
      >
        <View style={styles.orderCardHeader}>
          <View style={styles.orderCategoryBadge}>
            <Text style={styles.orderCategoryIcon}>
              {order.category === "medicine" ? "💊" : "🛒"}
            </Text>
            <Text style={styles.orderCategoryText}>
              {order.category?.charAt(0).toUpperCase() + order.category?.slice(1)}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabels[order.status] || order.status}
            </Text>
          </View>
        </View>

        <Text style={styles.orderAddress} numberOfLines={1}>
          📍 {order.deliveryAddress}
        </Text>

        <View style={styles.orderMeta}>
          <Text style={styles.orderMetaText}>
            {itemCount} item{itemCount !== 1 ? "s" : ""}
            {urgentCount > 0 ? ` · ${urgentCount} urgent` : ""}
          </Text>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {order.volunteer && (
          <View style={styles.orderVolunteer}>
            <Text style={styles.orderVolunteerText}>
              🙋 {order.volunteer.name || "Volunteer assigned"}
            </Text>
          </View>
        )}

        {isActive && (
          <View style={styles.trackBtn}>
            <Text style={styles.trackBtnText}>Track Delivery →</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Independent Delete Button */}
      {onDelete && (
        <TouchableOpacity 
          style={styles.absDeleteBtn}
          onPress={onDelete}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.smallDeleteBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  layout: { flex: 1 },
  content: { flex: 1 },
  contentInner: {},
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: colors.muted, fontSize: 16 },

  heading: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subheading: { color: colors.muted, marginBottom: 24, marginTop: 6, fontSize: 15 },

  // Filters
  filterRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary + "20",
    borderColor: colors.primary,
  },
  filterIcon: { fontSize: 14 },
  filterText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  filterTextActive: { color: colors.primary },

  // Stats
  statsRow: { gap: 14, marginBottom: 28 },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statTitle: { color: colors.muted, fontSize: 12, fontWeight: "500", marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: "800", color: colors.text },

  // Section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 },
  countBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { color: colors.primary, fontSize: 13, fontWeight: "700" },

  // Order card
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    position: "relative", // Ensure relative for absolute child
  },
  orderCardActive: { borderColor: colors.primary + "50" },
  orderCardClickable: {
    padding: 18,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingRight: 30, // Make room for absolute X button
  },
  orderCategoryBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderCategoryIcon: { fontSize: 16 },
  orderCategoryText: { fontSize: 14, fontWeight: "600", color: colors.text },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  absDeleteBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger + "20",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10, // Ensure it's on top
  },
  smallDeleteBtnText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  orderAddress: { fontSize: 13, color: colors.muted, marginBottom: 10 },
  orderMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderMetaText: { fontSize: 12, color: colors.muted },
  orderDate: { fontSize: 12, color: colors.muted },
  orderVolunteer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border + "50" },
  orderVolunteerText: { fontSize: 13, color: colors.primary, fontWeight: "500" },
  trackBtn: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: colors.primary + "15",
    borderRadius: 8,
    alignItems: "center",
  },
  trackBtnText: { color: colors.primary, fontWeight: "600", fontSize: 13 },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: colors.muted, fontSize: 16 },
  orderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  orderBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
