import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api";
import ElderSidebar, { ElderMobileBottomBar } from "../components/ElderSidebar";
import useResponsive from "../hooks/useResponsive";
import {
  connectSocket,
  joinDelivery,
  leaveDelivery,
  onLocationUpdate,
  onStatusUpdate,
  offLocationUpdate,
  offStatusUpdate,
} from "../api/socketService";

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
  medicine: "#8B5CF6",
  grocery: "#10B981",
};

const STATUS_STEPS = [
  { key: "pending", label: "Ordered", icon: "📦" },
  { key: "accepted", label: "Accepted", icon: "✅" },
  { key: "picked_up", label: "Picked Up", icon: "🏪" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "✔️" },
];

export default function DeliveryTrackingScreen({ route, navigation }) {
  const { orderId } = route.params || {};
  const responsive = useResponsive();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [volunteerLocation, setVolunteerLocation] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for live indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/delivery/order/${orderId}`);
        setOrder(res.data);
        if (res.data.volunteerLocation?.coordinates) {
          const [lng, lat] = res.data.volunteerLocation.coordinates;
          if (lat && lng) setVolunteerLocation({ latitude: lat, longitude: lng });
        }
      } catch (err) {
        console.error("FETCH ORDER ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  // Socket.IO real-time tracking
  useEffect(() => {
    if (!orderId) return;
    const socket = connectSocket();
    joinDelivery(orderId);

    onLocationUpdate((data) => {
      setVolunteerLocation({ latitude: data.latitude, longitude: data.longitude });
    });

    onStatusUpdate((data) => {
      setOrder((prev) =>
        prev ? { ...prev, status: data.status, estimatedArrival: data.estimatedArrival } : prev
      );
    });

    return () => {
      leaveDelivery(orderId);
      offLocationUpdate();
      offStatusUpdate();
    };
  }, [orderId]);

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
          <Text style={styles.loadingText}>Delivery not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isActive = !["delivered", "cancelled"].includes(order.status);

  const getStatusTime = (statusKey) => {
    const entry = order.statusHistory?.find((h) => h.status === statusKey);
    if (entry) {
      return new Date(entry.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return currentStepIndex >= STATUS_STEPS.findIndex((s) => s.key === statusKey)
      ? ""
      : "Pending";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[styles.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}
      >
        <ElderSidebar navigation={navigation} activeKey="DeliveryOrderScreen" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentInner, { padding: responsive.contentPadding }]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.statusBadge}>
                {isActive ? "🟢 IN PROGRESS" : order.status === "delivered" ? "✅ DELIVERED" : "❌ CANCELLED"}
              </Text>
              <Text style={styles.heading}>Delivery Status</Text>
            </View>
            {order.estimatedArrival && isActive && (
              <View style={styles.etaCard}>
                <Text style={styles.etaLabel}>Estimated Arrival</Text>
                <Text style={styles.etaTime}>
                  {new Date(order.estimatedArrival).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.mainGrid,
              { flexDirection: responsive.isMobile ? "column" : "row" },
            ]}
          >
            {/* Left Column */}
            <View style={styles.leftCol}>
              {/* Progress Stepper */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📍 Journey Progress</Text>
                <View style={styles.stepper}>
                  {STATUS_STEPS.map((step, i) => {
                    const isCompleted = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <View key={step.key} style={styles.stepRow}>
                        <View style={styles.stepIndicatorCol}>
                          <View
                            style={[
                              styles.stepCircle,
                              isCompleted && styles.stepCircleActive,
                              isCurrent && styles.stepCircleCurrent,
                            ]}
                          >
                            <Text style={styles.stepCircleText}>
                              {isCompleted ? step.icon : "○"}
                            </Text>
                          </View>
                          {i < STATUS_STEPS.length - 1 && (
                            <View
                              style={[
                                styles.stepConnector,
                                i < currentStepIndex && styles.stepConnectorActive,
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.stepInfo}>
                          <Text
                            style={[styles.stepLabel, isCompleted && styles.stepLabelActive]}
                          >
                            {step.label}
                          </Text>
                          <Text style={styles.stepTime}>{getStatusTime(step.key)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Map */}
              {isActive && (
                <View style={styles.card}>
                  <View style={styles.mapContainer}>
                    {MapView && volunteerLocation ? (
                      <MapView
                        style={styles.map}
                        initialRegion={{
                          ...volunteerLocation,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                        region={
                          volunteerLocation
                            ? { ...volunteerLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }
                            : undefined
                        }
                      >
                        {volunteerLocation && Marker && (
                          <Marker coordinate={volunteerLocation} title="Volunteer" />
                        )}
                      </MapView>
                    ) : (
                      <View style={styles.mapPlaceholder}>
                        <Text style={{ fontSize: 40 }}>🗺️</Text>
                        <Text style={styles.mapPlaceholderText}>
                          {volunteerLocation
                            ? "Map unavailable on web"
                            : "Waiting for volunteer location..."}
                        </Text>
                        {volunteerLocation && (
                          <Text style={styles.coordsText}>
                            📍 {volunteerLocation.latitude.toFixed(4)}, {volunteerLocation.longitude.toFixed(4)}
                          </Text>
                        )}
                      </View>
                    )}
                    {volunteerLocation && (
                      <View style={styles.liveBadge}>
                        <Animated.View
                          style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]}
                        />
                        <Text style={styles.liveText}>Live tracking</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Right Column */}
            <View style={styles.rightCol}>
              {/* Volunteer Info */}
              {order.volunteer && (
                <View style={styles.card}>
                  <View style={styles.volunteerHeader}>
                    <View style={styles.volunteerAvatar}>
                      <Text style={styles.volunteerAvatarText}>
                        {order.volunteer.name?.charAt(0)?.toUpperCase() || "V"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.volunteerName}>{order.volunteer.name}</Text>
                      <Text style={styles.volunteerRole}>Your Delivery Volunteer</Text>
                    </View>
                  </View>

                  {order.volunteer.phone && (
                    <View style={styles.contactRow}>
                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => Linking.openURL(`tel:${order.volunteer.phone}`)}
                      >
                        <Text style={styles.contactBtnIcon}>📞</Text>
                        <Text style={styles.contactBtnText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => Linking.openURL(`sms:${order.volunteer.phone}`)}
                      >
                        <Text style={styles.contactBtnIcon}>💬</Text>
                        <Text style={styles.contactBtnText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Delivery Items */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {order.category === "medicine" ? "💊" : "🛒"} Delivery Items
                </Text>
                {order.items?.map((item, i) => (
                  <View key={i} style={styles.deliveryItem}>
                    <View style={styles.deliveryItemLeft}>
                      <Text style={styles.deliveryItemName}>{item.name}</Text>
                      {item.notes ? (
                        <Text style={styles.deliveryItemNote}>{item.notes}</Text>
                      ) : null}
                    </View>
                    <View style={styles.deliveryItemRight}>
                      <Text style={styles.deliveryItemQty}>×{item.quantity}</Text>
                      {item.urgent && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentText}>URGENT</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Special Instructions */}
              {order.specialInstructions ? (
                <View style={[styles.card, styles.instructionCard]}>
                  <Text style={styles.instructionLabel}>📢 SPECIAL INSTRUCTIONS</Text>
                  <Text style={styles.instructionText}>{order.specialInstructions}</Text>
                </View>
              ) : null}

              {/* Delivery Address */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📍 Delivery Address</Text>
                <Text style={styles.addressText}>{order.deliveryAddress}</Text>
              </View>
            </View>
          </View>

          {/* Reschedule Banner */}
          {isActive && (
            <View style={styles.rescheduleBanner}>
              <View style={styles.rescheduleLeft}>
                <Text style={styles.rescheduleIcon}>🔔</Text>
                <View>
                  <Text style={styles.rescheduleTitle}>Need to update?</Text>
                  <Text style={styles.rescheduleDesc}>
                    You can update special instructions before delivery
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.rescheduleBtn}>
                <Text style={styles.rescheduleBtnText}>Update Instructions</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: responsive.showBottomBar ? 80 : 40 }} />
        </ScrollView>

        <ElderMobileBottomBar navigation={navigation} activeKey="DeliveryOrderScreen" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  layout: { flex: 1 },
  content: { flex: 1 },
  contentInner: {},
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: colors.muted, fontSize: 16 },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heading: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  etaCard: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  etaLabel: { fontSize: 11, color: "#FFF", opacity: 0.8, fontWeight: "600" },
  etaTime: { fontSize: 24, fontWeight: "800", color: "#FFF", marginTop: 4 },

  // Grid
  mainGrid: { gap: 20 },
  leftCol: { flex: 2, gap: 20 },
  rightCol: { flex: 1, gap: 20, minWidth: 280 },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 16 },

  // Stepper
  stepper: {},
  stepRow: { flexDirection: "row", alignItems: "flex-start" },
  stepIndicatorCol: { alignItems: "center", width: 40 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  stepCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "20",
  },
  stepCircleCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepCircleText: { fontSize: 14 },
  stepConnector: {
    width: 2,
    height: 32,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  stepConnectorActive: { backgroundColor: colors.primary },
  stepInfo: { marginLeft: 14, paddingBottom: 20, flex: 1 },
  stepLabel: { fontSize: 15, fontWeight: "600", color: colors.muted },
  stepLabelActive: { color: colors.text },
  stepTime: { fontSize: 12, color: colors.muted, marginTop: 2 },

  // Map
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: 12,
    gap: 8,
  },
  mapPlaceholderText: { color: colors.muted, fontSize: 14 },
  coordsText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  liveBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card + "E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: { color: colors.text, fontSize: 12, fontWeight: "600" },

  // Volunteer
  volunteerHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  volunteerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary + "30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  volunteerAvatarText: { fontSize: 22, fontWeight: "700", color: colors.primary },
  volunteerName: { fontSize: 17, fontWeight: "700", color: colors.text },
  volunteerRole: { fontSize: 13, color: colors.primary, fontWeight: "500" },
  contactRow: { flexDirection: "row", gap: 12 },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactBtnIcon: { fontSize: 16 },
  contactBtnText: { color: colors.text, fontWeight: "600", fontSize: 13 },

  // Delivery items
  deliveryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "50",
  },
  deliveryItemLeft: { flex: 1 },
  deliveryItemName: { fontSize: 15, fontWeight: "600", color: colors.text },
  deliveryItemNote: { fontSize: 12, color: colors.muted, marginTop: 2 },
  deliveryItemRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  deliveryItemQty: { fontSize: 14, color: colors.muted, fontWeight: "600" },
  urgentBadge: {
    backgroundColor: colors.danger + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  urgentText: { fontSize: 9, fontWeight: "800", color: colors.danger },

  // Instructions
  instructionCard: {
    borderColor: colors.primary + "40",
    backgroundColor: colors.primary + "08",
  },
  instructionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  instructionText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  addressText: { fontSize: 14, color: colors.text, lineHeight: 20 },

  // Reschedule banner
  rescheduleBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.danger,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
  },
  rescheduleLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rescheduleIcon: { fontSize: 24 },
  rescheduleTitle: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  rescheduleDesc: { fontSize: 12, color: "#FFF", opacity: 0.85, marginTop: 2 },
  rescheduleBtn: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rescheduleBtnText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
});
