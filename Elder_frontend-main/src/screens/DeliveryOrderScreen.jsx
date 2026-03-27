import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
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
  primaryDark: "#2563EB",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  text: "#F1F5F9",
  muted: "#94A3B8",
  medicine: "#8B5CF6",
  grocery: "#10B981",
  urgentBg: "#EF444420",
  urgentBorder: "#EF4444",
};

export default function DeliveryOrderScreen({ navigation }) {
  const responsive = useResponsive();

  const [category, setCategory] = useState("medicine");
  const [items, setItems] = useState([{ name: "", quantity: 1, notes: "", urgent: false }]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = review

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, notes: "", urgent: false }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const validate = () => {
    if (!items.some((i) => i.name.trim())) {
      const msg = "Please add at least one item";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Error", msg);
      return false;
    }
    if (!deliveryAddress.trim()) {
      const msg = "Please enter a delivery address";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Error", msg);
      return false;
    }
    return true;
  };

  const handleReview = () => {
    if (validate()) setStep(2);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const cleanItems = items
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          quantity: parseInt(i.quantity) || 1,
          notes: i.notes.trim(),
          urgent: i.urgent,
        }));

      await api.post("/delivery/order", {
        category,
        items: cleanItems,
        deliveryAddress: deliveryAddress.trim(),
        specialInstructions: specialInstructions.trim(),
      });

      const msg = "Delivery order placed successfully!";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Success", msg);
      navigation.goBack();
    } catch (err) {
      console.error("CREATE DELIVERY ERROR:", err);
      const msg = "Failed to place delivery order";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <>
      {/* Category Selector */}
      <Text style={styles.sectionLabel}>CATEGORY</Text>
      <View style={styles.categoryRow}>
        <TouchableOpacity
          style={[
            styles.categoryBtn,
            category === "medicine" && styles.categoryBtnActiveMed,
          ]}
          onPress={() => setCategory("medicine")}
        >
          <Text style={styles.categoryIcon}>💊</Text>
          <Text
            style={[
              styles.categoryText,
              category === "medicine" && styles.categoryTextActive,
            ]}
          >
            Medicine
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryBtn,
            category === "grocery" && styles.categoryBtnActiveGro,
          ]}
          onPress={() => setCategory("grocery")}
        >
          <Text style={styles.categoryIcon}>🛒</Text>
          <Text
            style={[
              styles.categoryText,
              category === "grocery" && styles.categoryTextActive,
            ]}
          >
            Grocery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items */}
      <Text style={styles.sectionLabel}>
        {category === "medicine" ? "MEDICATIONS" : "GROCERY ITEMS"}
      </Text>

      {items.map((item, index) => (
        <View
          key={index}
          style={[styles.itemCard, item.urgent && styles.itemCardUrgent]}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemNumber}>#{index + 1}</Text>
            {items.length > 1 && (
              <TouchableOpacity onPress={() => removeItem(index)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            placeholder={category === "medicine" ? "Medicine name..." : "Item name..."}
            placeholderTextColor={colors.muted}
            value={item.name}
            onChangeText={(v) => updateItem(index, "name", v)}
            style={styles.input}
          />

          <View style={styles.itemRow}>
            <View style={styles.qtyContainer}>
              <Text style={styles.inputLabel}>Qty</Text>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() =>
                    updateItem(index, "quantity", Math.max(1, item.quantity - 1))
                  }
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateItem(index, "quantity", item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.urgentContainer}>
              <Text style={styles.inputLabel}>Urgent</Text>
              <Switch
                value={item.urgent}
                onValueChange={(v) => updateItem(index, "urgent", v)}
                trackColor={{ false: colors.border, true: colors.danger + "80" }}
                thumbColor={item.urgent ? colors.danger : colors.muted}
              />
            </View>
          </View>

          <TextInput
            placeholder="Notes (optional)..."
            placeholderTextColor={colors.muted}
            value={item.notes}
            onChangeText={(v) => updateItem(index, "notes", v)}
            style={[styles.input, { minHeight: 44 }]}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
        <Text style={styles.addItemText}>+ Add Another Item</Text>
      </TouchableOpacity>

      {/* Delivery Address */}
      <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>
      <TextInput
        placeholder="Enter your delivery address..."
        placeholderTextColor={colors.muted}
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
        style={[styles.input, styles.addressInput]}
        multiline
      />

      {/* Special Instructions */}
      <Text style={styles.sectionLabel}>SPECIAL INSTRUCTIONS</Text>
      <TextInput
        placeholder="e.g., Ring bell twice, leave at door..."
        placeholderTextColor={colors.muted}
        value={specialInstructions}
        onChangeText={setSpecialInstructions}
        style={[styles.input, { minHeight: 80 }]}
        multiline
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleReview}>
        <Text style={styles.primaryBtnText}>Review Order →</Text>
      </TouchableOpacity>
    </>
  );

  const renderReview = () => {
    const validItems = items.filter((i) => i.name.trim());
    return (
      <>
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewIcon}>
              {category === "medicine" ? "💊" : "🛒"}
            </Text>
            <Text style={styles.reviewTitle}>
              {category === "medicine" ? "Medicine" : "Grocery"} Delivery
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.reviewLabel}>ITEMS ({validItems.length})</Text>
          {validItems.map((item, i) => (
            <View key={i} style={styles.reviewItem}>
              <View style={styles.reviewItemLeft}>
                <Text style={styles.reviewItemName}>{item.name}</Text>
                {item.notes ? (
                  <Text style={styles.reviewItemNote}>{item.notes}</Text>
                ) : null}
              </View>
              <View style={styles.reviewItemRight}>
                <Text style={styles.reviewItemQty}>×{item.quantity}</Text>
                {item.urgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentBadgeText}>URGENT</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          <View style={styles.divider} />

          <Text style={styles.reviewLabel}>DELIVER TO</Text>
          <Text style={styles.reviewValue}>{deliveryAddress}</Text>

          {specialInstructions ? (
            <>
              <Text style={[styles.reviewLabel, { marginTop: 16 }]}>
                SPECIAL INSTRUCTIONS
              </Text>
              <View style={styles.instructionBox}>
                <Text style={styles.instructionIcon}>📢</Text>
                <Text style={styles.reviewValue}>{specialInstructions}</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep(1)}
          >
            <Text style={styles.backBtnText}>← Edit Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Place Order 🚀</Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.layout,
          { flexDirection: responsive.showSidebar ? "row" : "column" },
        ]}
      >
        <ElderSidebar navigation={navigation} activeKey="DeliveryOrderScreen" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentInner,
            { padding: responsive.contentPadding },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.tagline}>
                {category === "medicine" ? "💊 MEDICINE" : "🛒 GROCERY"} DELIVERY
              </Text>
              <Text style={styles.heading}>
                {step === 1 ? "New Delivery Order" : "Review Your Order"}
              </Text>
            </View>
            <View style={styles.stepIndicator}>
              <View
                style={[styles.stepDot, step >= 1 && styles.stepDotActive]}
              />
              <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
              <View
                style={[styles.stepDot, step >= 2 && styles.stepDotActive]}
              />
            </View>
          </View>

          {step === 1 ? renderForm() : renderReview()}

          <View style={{ height: responsive.showBottomBar ? 80 : 40 }} />
        </ScrollView>

        <ElderMobileBottomBar
          navigation={navigation}
          activeKey="DeliveryOrderScreen"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  layout: { flex: 1 },
  content: { flex: 1 },
  contentInner: {},

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  stepDotActive: { backgroundColor: colors.primary },
  stepLine: { width: 32, height: 2, backgroundColor: colors.border },
  stepLineActive: { backgroundColor: colors.primary },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 20,
  },

  // Category
  categoryRow: { flexDirection: "row", gap: 12 },
  categoryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: 10,
  },
  categoryBtnActiveMed: {
    borderColor: colors.medicine,
    backgroundColor: colors.medicine + "15",
  },
  categoryBtnActiveGro: {
    borderColor: colors.grocery,
    backgroundColor: colors.grocery + "15",
  },
  categoryIcon: { fontSize: 24 },
  categoryText: { fontSize: 16, fontWeight: "600", color: colors.muted },
  categoryTextActive: { color: colors.text },

  // Items
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  itemCardUrgent: {
    borderColor: colors.urgentBorder,
    backgroundColor: colors.urgentBg,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  itemNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  removeBtn: { fontSize: 16, color: colors.danger, fontWeight: "700" },

  input: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
  },
  addressInput: { minHeight: 60 },

  itemRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  qtyContainer: { flex: 1 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: 6,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: { fontSize: 18, color: colors.text, fontWeight: "700" },
  qtyValue: { fontSize: 18, color: colors.text, fontWeight: "700", minWidth: 24, textAlign: "center" },
  urgentContainer: { alignItems: "center" },

  addItemBtn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary + "40",
    borderStyle: "dashed",
    alignItems: "center",
    marginBottom: 8,
  },
  addItemText: { color: colors.primary, fontWeight: "600", fontSize: 14 },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },

  // Review
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reviewIcon: { fontSize: 28 },
  reviewTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  reviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "40",
  },
  reviewItemLeft: { flex: 1 },
  reviewItemName: { fontSize: 15, color: colors.text, fontWeight: "600" },
  reviewItemNote: { fontSize: 12, color: colors.muted, marginTop: 2 },
  reviewItemRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewItemQty: { fontSize: 15, color: colors.muted, fontWeight: "600" },
  urgentBadge: {
    backgroundColor: colors.danger + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  urgentBadgeText: { fontSize: 10, fontWeight: "800", color: colors.danger },
  reviewValue: { fontSize: 14, color: colors.text, lineHeight: 20 },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.primary + "10",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  instructionIcon: { fontSize: 16 },

  reviewActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  backBtn: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  backBtnText: { color: colors.muted, fontSize: 15, fontWeight: "600" },
});
