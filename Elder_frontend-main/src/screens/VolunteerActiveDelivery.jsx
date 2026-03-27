import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import useResponsive from "../hooks/useResponsive";

import { MapView, Marker } from "../components/MapModule";

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

const STATUS_FLOW = [
  { key: "accepted", label: "Accepted", nextLabel: "Mark Picked Up", icon: "✅" },
  { key: "picked_up", label: "Picked Up", nextLabel: "Out for Delivery", icon: "🏪" },
  { key: "out_for_delivery", label: "Out for Delivery", nextLabel: "Mark Delivered", icon: "🚚" },
  { key: "delivered", label: "Delivered", nextLabel: null, icon: "✔️" },
];

export default function VolunteerActiveDelivery({ route, navigation }) {
  const { orderId } = route.params || {};
  const { user } = useContext(AuthContext);
  const responsive = useResponsive();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const locationWatcher = useRef(null);

  // Fetch order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/delivery/order/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error("FETCH ACTIVE DELIVERY ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  // Live location broadcasting
  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location permission denied");
          return;
        }

        locationWatcher.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (location) => {
            try {
              await api.put(`/delivery/location/${orderId}`, {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            } catch (err) {
              console.log("Location update failed:", err.message);
            }
          }
        );
      } catch (err) {
        console.error("Location tracking error:", err);
      }
    };

    if (orderId && order && !["delivered", "cancelled"].includes(order.status)) {
      startLocationTracking();
    }

    return () => {
      if (locationWatcher.current) {
        locationWatcher.current.remove();
      }
    };
  }, [orderId, order?.status]);

  const updateStatus = async (newStatus) => {
    const msg =
      newStatus === "delivered"
        ? "Mark this delivery as completed?"
        : `Update status to "${newStatus.replace(/_/g, " ")}"?`;

    const proceed = async () => {
      try {
        setUpdating(true);
        const eta = new Date();
        eta.setMinutes(eta.getMinutes() + 30);

        await api.put(`/delivery/status/${orderId}`, {
          status: newStatus,
          estimatedArrival: eta.toISOString(),
        });

        setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));

        if (newStatus === "delivered") {
          const doneMsg = "Delivery completed successfully!";
          Platform.OS === "web" ? alert(doneMsg) : Alert.alert("Success", doneMsg);
          navigation.goBack();
        }
      } catch (err) {
        console.error("STATUS UPDATE ERROR:", err);
        const errMsg = "Failed to update status";
        Platform.OS === "web" ? alert(errMsg) : Alert.alert("Error", errMsg);
      } finally {
        setUpdating(false);
      }
    };

    if (Platform.OS === "web") {
      if (confirm(msg)) proceed();
    } else {
      Alert.alert("Confirm", msg, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: proceed },
      ]);
    }
  };

  const toggleCheckItem = (index) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getNextStatus = () => {
    const currentIndex = STATUS_FLOW.findIndex((s) => s.key === order?.status);
    if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading delivery...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={styles.loadingText}>No active delivery found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusIndex = STATUS_FLOW.findIndex((s) => s.key === order.status);
  const nextStatus = getNextStatus();
  const elderInfo = order.elder || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentInner, { padding: responsive.contentPadding }]}
      >
        {/* Header */}
        <Text style={styles.tagline}>ACTIVE DELIVERY</Text>
        <Text style={styles.heading}>
          {order.category === "medicine" ? "💊 Medicine" : "🛒 Grocery"} Delivery
        </Text>

        <View
          style={[
            styles.mainGrid,
            { flexDirection: responsive.isMobile ? "column" : "row" },
          ]}
        >
          {/* Left Column */}
          <View style={styles.leftCol}>
            {/* Recipient Card */}
            <View style={styles.card}>
              <Text style={styles.recipientLabel}>RECIPIENT</Text>
              <View style={styles.recipientRow}>
                <View style={styles.recipientAvatar}>
                  <Text style={styles.recipientAvatarText}>
                    {elderInfo.name?.charAt(0)?.toUpperCase() || "E"}
                  </Text>
                </View>
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientName}>{elderInfo.name || "Elder"}</Text>
                  <Text style={styles.recipientAddress}>
                    📍 {order.deliveryAddress}
                  </Text>
                </View>
                {elderInfo.phone && (
                  <View style={styles.recipientActions}>
                    <TouchableOpacity
                      style={styles.actionCircle}
                      onPress={() => Linking.openURL(`tel:${elderInfo.phone}`)}
                    >
                      <Text style={styles.actionCircleText}>📞</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionCircle}
                      onPress={() => Linking.openURL(`sms:${elderInfo.phone}`)}
                    >
                      <Text style={styles.actionCircleText}>💬</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Special Instructions */}
              {order.specialInstructions ? (
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionLabel}>📢 SPECIAL INSTRUCTION</Text>
                  <Text style={styles.instructionText}>{order.specialInstructions}</Text>
                </View>
              ) : null}
            </View>

            {/* Delivery Checklist */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📋 Delivery Checklist</Text>
              {order.items?.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.checklistItem,
                    checkedItems[i] && styles.checklistItemChecked,
                    item.urgent && styles.checklistItemUrgent,
                  ]}
                  onPress={() => toggleCheckItem(i)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      checkedItems[i] && styles.checkboxChecked,
                    ]}
                  >
                    {checkedItems[i] && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <View style={styles.checklistInfo}>
                    <Text
                      style={[
                        styles.checklistName,
                        checkedItems[i] && styles.checklistNameChecked,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.notes ? (
                      <Text style={styles.checklistNote}>{item.notes}</Text>
                    ) : null}
                  </View>
                  <View style={styles.checklistRight}>
                    <Text style={styles.checklistQty}>×{item.quantity}</Text>
                    {item.urgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>URGENT</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightCol}>
            {/* Mini Map */}
            <View style={styles.card}>
              <View style={styles.mapContainer}>
                {MapView ? (
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: 28.6139,
                      longitude: 77.209,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }}
                  >
                    {Marker && (
                      <Marker
                        coordinate={{ latitude: 28.6139, longitude: 77.209 }}
                        title="Destination"
                      />
                    )}
                  </MapView>
                ) : (
                  <View style={styles.mapPlaceholder}>
                    <Text style={{ fontSize: 36 }}>🗺️</Text>
                    <Text style={styles.mapPlaceholderText}>
                      Map preview
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => {
                  const url = Platform.select({
                    ios: `maps:?daddr=${encodeURIComponent(order.deliveryAddress)}`,
                    android: `google.navigation:q=${encodeURIComponent(order.deliveryAddress)}`,
                    default: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress)}`,
                  });
                  Linking.openURL(url);
                }}
              >
                <Text style={styles.navBtnIcon}>🧭</Text>
                <Text style={styles.navBtnText}>Open Navigation</Text>
              </TouchableOpacity>
            </View>

            {/* Status Update */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Status Update</Text>
              {STATUS_FLOW.map((step, i) => {
                const isCompleted = i <= currentStatusIndex;
                const isCurrent = i === currentStatusIndex;
                return (
                  <View
                    key={step.key}
                    style={[
                      styles.statusItem,
                      isCurrent && styles.statusItemCurrent,
                      isCompleted && !isCurrent && styles.statusItemDone,
                    ]}
                  >
                    <Text style={styles.statusItemIcon}>{step.icon}</Text>
                    <Text
                      style={[
                        styles.statusItemLabel,
                        isCompleted && styles.statusItemLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                    {isCompleted && !isCurrent && (
                      <Text style={styles.statusCheck}>✔</Text>
                    )}
                    {isCurrent && (
                      <Text style={styles.statusCurrent}>•••</Text>
                    )}
                  </View>
                );
              })}

              <Text style={styles.lastUpdated}>
                Updated {new Date(order.updatedAt).toLocaleString()}
              </Text>
            </View>

            {/* Next Action */}
            {nextStatus && (
              <TouchableOpacity
                style={[
                  styles.nextActionBtn,
                  nextStatus.key === "delivered" && styles.deliveredBtn,
                ]}
                onPress={() => updateStatus(nextStatus.key)}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.nextActionText}>{nextStatus?.nextLabel || STATUS_FLOW[currentStatusIndex]?.nextLabel}</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.quickActionBtn}>
                <Text style={styles.quickActionIcon}>📸</Text>
                <Text style={styles.quickActionLabel}>Photo Proof</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionBtn, styles.reportBtn]}>
                <Text style={styles.quickActionIcon}>⚠️</Text>
                <Text style={styles.quickActionLabel}>Report Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1 },
  contentInner: {},
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: colors.muted, fontSize: 16 },
  backButton: { marginTop: 12, padding: 12 },
  backButtonText: { color: colors.primary, fontWeight: "600" },

  tagline: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heading: { fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 24 },

  mainGrid: { gap: 20 },
  leftCol: { flex: 2, gap: 20 },
  rightCol: { flex: 1, gap: 20, minWidth: 280 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 14 },

  // Recipient
  recipientLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 1,
    marginBottom: 12,
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  recipientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + "30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  recipientAvatarText: { fontSize: 22, fontWeight: "700", color: colors.primary },
  recipientInfo: { flex: 1 },
  recipientName: { fontSize: 20, fontWeight: "700", color: colors.text },
  recipientAddress: { fontSize: 13, color: colors.muted, marginTop: 4 },
  recipientActions: { flexDirection: "row", gap: 8 },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary + "40",
  },
  actionCircleText: { fontSize: 18 },

  // Instructions
  instructionBox: {
    backgroundColor: colors.primary + "10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + "30",
    padding: 16,
  },
  instructionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.warning,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  instructionText: { fontSize: 14, color: colors.text, lineHeight: 20 },

  // Checklist
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  checklistItemChecked: { opacity: 0.6, borderColor: colors.success + "40" },
  checklistItemUrgent: { borderColor: colors.danger + "50" },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkMark: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  checklistInfo: { flex: 1 },
  checklistName: { fontSize: 15, fontWeight: "600", color: colors.text },
  checklistNameChecked: { textDecorationLine: "line-through", color: colors.muted },
  checklistNote: { fontSize: 12, color: colors.muted, marginTop: 2 },
  checklistRight: { alignItems: "flex-end", gap: 4 },
  checklistQty: { fontSize: 14, fontWeight: "600", color: colors.muted },
  urgentBadge: {
    backgroundColor: colors.danger + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  urgentText: { fontSize: 9, fontWeight: "800", color: colors.danger },

  // Map
  mapContainer: { height: 180, borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    gap: 8,
  },
  mapPlaceholderText: { color: colors.muted, fontSize: 13 },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 10,
  },
  navBtnIcon: { fontSize: 18 },
  navBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // Status
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  statusItemCurrent: {
    backgroundColor: colors.primary + "15",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusItemDone: { opacity: 0.6 },
  statusItemIcon: { fontSize: 18 },
  statusItemLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.muted },
  statusItemLabelActive: { color: colors.text },
  statusCheck: { color: colors.success, fontSize: 14, fontWeight: "700" },
  statusCurrent: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  lastUpdated: {
    color: colors.muted,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },

  // Next Action
  nextActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  deliveredBtn: { backgroundColor: colors.success },
  nextActionText: { color: "#FFF", fontSize: 17, fontWeight: "700" },

  // Quick Actions
  quickActionsRow: { flexDirection: "row", gap: 12 },
  quickActionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  reportBtn: { borderColor: colors.danger + "40" },
  quickActionIcon: { fontSize: 24 },
  quickActionLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
});
