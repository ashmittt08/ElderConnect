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
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import useResponsive from "../hooks/useResponsive";

import * as SecureStore from "expo-secure-store";
import { MapView, Marker } from "../components/MapModule";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const colors = {
  bg: "#0F172A", // Dark theme background
  card: "#1E293B",
  cardOverlay: "rgba(30, 41, 59, 0.95)",
  border: "#334155",
  primary: "#60B246", // Swiggy Green
  primaryDark: "#4a8f35",
  accent: "#FC8019", // Swiggy Orange
  text: "#F1F5F9",
  muted: "#94A3B8",
  pulse: "rgba(96, 178, 70, 0.4)",
  danger: "#EF4444",
};

const STATUS_FLOW = [
  { key: "accepted", label: "Accepted", nextLabel: "Mark Picked Up (I have the items)", icon: "✓" },
  { key: "picked_up", label: "Picked Up", nextLabel: "Start Delivery (Out for Delivery)", icon: "✓" },
  { key: "out_for_delivery", label: "On the way", nextLabel: "Mark Delivered Successfully", icon: "🛵" },
  { key: "delivered", label: "Delivered", nextLabel: null, icon: "🏁" },
];

export default function VolunteerActiveDelivery({ route, navigation }) {
  const { orderId } = route.params || {};
  const { user } = useContext(AuthContext);
  const responsive = useResponsive();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const [destination, setDestination] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const locationWatcher = useRef(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
      ])
    );
    pulse.start();
    return () => {
      try {
        if (pulse && typeof pulse.stop === 'function') {
          pulse.stop();
        }
      } catch (e) {
        console.warn("Pulse animation stop error:", e);
      }
    };
  }, [pulseAnim]);

  // Fetch order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) return;
        const res = await api.get(`/delivery/order/${orderId}`);
        setOrder(res.data);
        
        // Geocode the destination address
        if (res.data.deliveryAddress) {
          try {
            const geocoded = await Location.geocodeAsync(res.data.deliveryAddress);
            if (geocoded && geocoded.length > 0) {
              setDestination({
                latitude: geocoded[0].latitude,
                longitude: geocoded[0].longitude,
              });
            } else {
              // Fallback to Bhopal center if geocoding fails
              setDestination({ latitude: 23.2599, longitude: 77.4126 });
            }
          } catch (e) {
            console.warn("Geocoding failed:", e);
            setDestination({ latitude: 23.2599, longitude: 77.4126 });
          }
        }
      } catch (err) {
        console.error("FETCH ACTIVE DELIVERY ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Persistence for checklists
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        const saved = await SecureStore.getItemAsync(`checklist_${orderId}`);
        if (saved) setCheckedItems(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to load checklist", e);
      }
    };
    if (orderId) loadChecklist();
  }, [orderId]);

  useEffect(() => {
    const saveChecklist = async () => {
      try {
        await SecureStore.setItemAsync(`checklist_${orderId}`, JSON.stringify(checkedItems));
      } catch (e) {
        console.warn("Failed to save checklist", e);
      }
    };
    if (orderId && Object.keys(checkedItems).length > 0) saveChecklist();
  }, [checkedItems, orderId]);

  // Live location broadcasting & Local state updating
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
            const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            setCurrentLocation(coords); // Update local map
            
            try {
              // Send server updates quietly in background
              await api.put(`/delivery/location/${orderId}`, coords);
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
        try {
          if (typeof locationWatcher.current.remove === 'function') {
            locationWatcher.current.remove();
          }
        } catch (err) {
          console.warn("Location watcher removal error:", err);
        }
        locationWatcher.current = null;
      }
    };
  }, [orderId, order?.status]);

  const updateStatus = async (newStatus) => {
    const proceed = async () => {
      try {
        setUpdating(true);
        const eta = new Date();
        eta.setMinutes(eta.getMinutes() + 30); // simplistic ETA

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
      proceed();
    } else {
      const msg = newStatus === "delivered"
        ? "Mark this delivery as completed?"
        : `Update status to "${newStatus.replace(/_/g, " ")}"?`;
        
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
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading delivery dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={styles.loadingText}>No active delivery found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusIndex = STATUS_FLOW.findIndex((s) => s.key === order.status);
  const nextStatus = getNextStatus();
  const elderInfo = order.elder || {};
  const isActive = !["delivered", "cancelled"].includes(order.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Section - Top Half */}
      <View style={styles.mapSection}>
        {isActive ? (
          <MapView
            style={styles.map}
            volunteer={currentLocation}
            destination={destination}
            initialRegion={{
              ...(currentLocation || destination || { latitude: 23.2599, longitude: 77.4126 }),
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Map unavailable</Text>
          </View>
        )}

        {/* Back navigation overlay */}
        <TouchableOpacity style={styles.topBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topBackBtnIcon}>←</Text>
        </TouchableOpacity>

        {/* Live Broadcast Indicator */}
        {isActive && currentLocation && (
          <View style={styles.liveBadgeOverlay}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveTextLabel}>BROADCASTING LOCATION</Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet - Details & Actions */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.tagline}>VOLUNTEER DASHBOARD</Text>
          <Text style={styles.orderId}>#{order._id.slice(-6).toUpperCase()}</Text>
        </View>

        <Text style={styles.heading}>
          {order.category === "medicine" ? "💊 Medicine" : "🛒 Grocery"} Drop-off
        </Text>

        {/* Action Button - Primary Focus */}
        {nextStatus && (
          <TouchableOpacity
            style={[styles.mainActionBtn, updating && styles.mainActionBtnDisabled]}
            disabled={updating}
            activeOpacity={0.8}
            onPress={() => updateStatus(nextStatus.key)}
          >
            {updating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.mainActionText}>{nextStatus.nextLabel || "Complete Delivery"}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Horizontal Status Stepper */}
        <View style={styles.stepperContainer}>
          {STATUS_FLOW.map((step, i) => {
            const isCompleted = i <= currentStatusIndex;
            const isCurrent = i === currentStatusIndex;

            return (
              <View key={step.key} style={styles.stepWrapper}>
                <View style={styles.stepNodeContainer}>
                  <View style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isCurrent && styles.stepCircleCurrent
                  ]}>
                    <Text style={[
                      styles.stepIcon,
                      isCompleted && styles.stepIconActive,
                      isCurrent && { fontSize: 16 }
                    ]}>
                      {isCompleted ? step.icon : ""}
                    </Text>
                  </View>
                  <Animated.View style={[
                    styles.stepPulse,
                    { transform: [{ scale: pulseAnim }], opacity: isCurrent ? 0.5 : 0 }
                  ]} />
                </View>

                <Text style={[styles.stepLabelText, isCompleted && styles.stepLabelTextActive]}>
                  {step.label}
                </Text>

                {i < STATUS_FLOW.length - 1 && (
                  <View style={[
                    styles.stepLine,
                    i < currentStatusIndex && styles.stepLineActive
                  ]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Elder Info Card */}
        <View style={styles.card}>
          <Text style={styles.recipientLabel}>DELIVERING TO</Text>
          <View style={styles.recipientRow}>
            <View style={styles.recipientAvatar}>
              <Text style={styles.recipientAvatarText}>
                {elderInfo.name?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientName}>{elderInfo.name}</Text>
              <Text style={styles.recipientAddress}>{order.deliveryAddress}</Text>
              <TouchableOpacity
                style={styles.detailsNavBtn}
                onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress)}`)}
              >
                <Text style={styles.detailsNavIcon}>📍</Text>
                <Text style={styles.detailsNavText}>Open Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {elderInfo.phone && isActive && (
            <View style={styles.contactActionsRow}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(`tel:${elderInfo.phone}`)}
              >
                <Text style={styles.contactBtnIcon}>📞</Text>
                <Text style={styles.contactBtnText}>Call Elder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(`sms:${elderInfo.phone}`)}
              >
                <Text style={styles.contactBtnIcon}>💬</Text>
                <Text style={styles.contactBtnText}>Send Text</Text>
              </TouchableOpacity>
            </View>
          )}

          {order.specialInstructions ? (
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionLabel}>📢 SPECIAL INSTRUCTION</Text>
              <Text style={styles.instructionText}>{order.specialInstructions}</Text>
            </View>
          ) : null}
        </View>

        {/* Items Checklist */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Verify Items ({order.items?.length})</Text>
          <Text style={styles.cardSubtitle}>Tap items below as you collect them.</Text>
          
          <View style={styles.checklistGroup}>
            {order.items?.map((item, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                style={[
                  styles.checklistItem,
                  checkedItems[i] && styles.checklistItemChecked,
                ]}
                onPress={() => toggleCheckItem(i)}
              >
                <View style={[styles.checkbox, checkedItems[i] && styles.checkboxChecked]}>
                  {checkedItems[i] && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <View style={styles.checklistInfo}>
                  <Text style={[styles.checklistName, checkedItems[i] && styles.checklistNameChecked]}>
                    {item.name}
                  </Text>
                  {item.notes ? (
                    <Text style={styles.checklistNote}>{item.notes}</Text>
                  ) : null}
                </View>
                <View style={styles.checklistRight}>
                  <Text style={[styles.checklistQty, checkedItems[i] && { opacity: 0.5 }]}>
                    ×{item.quantity}
                  </Text>
                  {item.urgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URG</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: colors.muted, fontSize: 16 },
  backBtn: { marginTop: 12, padding: 12, backgroundColor: colors.card, borderRadius: 8 },
  backBtnText: { color: colors.text, fontWeight: "600" },

  // Map Section
  mapSection: {
    height: Platform.OS === "web" ? "45%" : SCREEN_HEIGHT * 0.40,
    width: "100%",
    backgroundColor: "#111",
    position: "relative",
  },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  mapPlaceholderText: { color: colors.muted },
  topBackBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  topBackBtnIcon: { color: "#FFF", fontSize: 24, fontWeight: "bold" },
  liveBadgeOverlay: {
    position: "absolute",
    bottom: 30, // Above the sheet radius
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  liveTextLabel: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Bottom Sheet
  sheetContainer: {
    flex: 1,
    marginTop: -20,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetContent: {
    padding: 24,
    gap: 20,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagline: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 1.5,
  },
  orderId: {
    fontSize: 13,
    color: colors.muted,
  },
  heading: { 
    fontSize: 26, 
    fontWeight: "800", 
    color: colors.text, 
    letterSpacing: -0.5,
    marginTop: -10,
  },

  // Main Action Button (Swiggy Style)
  mainActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainActionBtnDisabled: {
    opacity: 0.7,
  },
  mainActionText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Stepper
  stepperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  stepWrapper: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  stepNodeContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stepCircleCompleted: {
    backgroundColor: colors.primaryDark,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  stepPulse: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.pulse,
    zIndex: 1,
  },
  stepIcon: {
    fontSize: 12,
    color: "#fff",
    opacity: 0,
  },
  stepIconActive: {
    opacity: 1,
  },
  stepLabelText: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "600",
    width: 70,
  },
  stepLabelTextActive: {
    color: colors.text,
    fontWeight: "700",
  },
  stepLine: {
    position: "absolute",
    top: 18,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },

  // Cards
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.muted, marginTop: -12 },

  // Elder Info
  recipientLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  recipientAvatarText: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  recipientInfo: { flex: 1 },
  recipientName: { fontSize: 18, fontWeight: "700", color: colors.text },
  recipientAddress: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 },
  detailsNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  detailsNavIcon: { fontSize: 12 },
  detailsNavText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  contactActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.bg,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactBtnIcon: { fontSize: 16 },
  contactBtnText: { color: colors.text, fontWeight: "600", fontSize: 14 },

  instructionContainer: {
    backgroundColor: colors.accent + "15",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent + "40",
    marginTop: 8,
  },
  instructionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 6,
  },
  instructionText: { fontSize: 14, color: colors.text, lineHeight: 20 },

  // Checklist
  checklistGroup: { gap: 10 },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  checklistItemChecked: { 
    opacity: 0.6, 
    borderColor: colors.primary + "60",
    backgroundColor: colors.primary + "05",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  checklistInfo: { flex: 1 },
  checklistName: { fontSize: 15, fontWeight: "600", color: colors.text },
  checklistNameChecked: { textDecorationLine: "line-through", color: colors.muted },
  checklistNote: { fontSize: 13, color: colors.muted, marginTop: 4 },
  checklistRight: { alignItems: "flex-end", gap: 6 },
  checklistQty: { fontSize: 15, fontWeight: "700", color: colors.text },
  urgentBadge: {
    backgroundColor: colors.danger + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  urgentText: { fontSize: 9, fontWeight: "800", color: colors.danger },
});
