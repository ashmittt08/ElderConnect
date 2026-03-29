import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api";
import { auth } from "../config/firebase";
import { useFocusEffect } from "@react-navigation/native";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#3B82F6",
  success: "#16A34A",
  warning: "#F59E0B",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();

      const [tasksRes, historyRes] = await Promise.all([
        api.get("/volunteer/tasks"),
        api.get("/delivery/history")
      ]);

      const regularTasks = tasksRes.data.map(t => ({ ...t, displayType: t.type }));
      const deliveryTasks = historyRes.data.map(d => ({
        _id: d._id,
        displayType: d.category === "medicine" ? "Medicine Delivery" : "Grocery Delivery",
        description: `Deliver to ${d.deliveryAddress}`,
        elder: d.elder,
        status: d.status,
        updatedAt: d.updatedAt,
      }));

      const mergedTasks = [...regularTasks, ...deliveryTasks]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setTasks(mergedTasks);
    } catch (err) {
      console.error("FETCH TASKS ERROR:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const completeTask = async (id) => {
    try {
      setProcessingId(id);
      const token = await auth.currentUser.getIdToken();

      await api.post(
        `/volunteer/complete/${id}`,
        {}
      );

      Alert.alert("Success", "Task marked as completed");

      setTasks((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, status: "completed" } : t
        )
      );
    } catch (err) {
      Alert.alert("Error", "Failed to mark task complete");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (tasks.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>
          No tasks assigned yet.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.type}>
              {item.displayType?.toUpperCase() || item.type?.toUpperCase()}
            </Text>

            <Text style={styles.description}>
              {item.description}
            </Text>

            <Text style={styles.info}>
              👤 {item.elder?.name || "N/A"}
            </Text>

            <Text style={styles.info}>
              📧 {item.elder?.email || "N/A"}
            </Text>

            <StatusBadge status={item.status} />

            {!["completed", "delivered", "cancelled"].includes(item.status?.toLowerCase()) && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => completeTask(item._id)}
                disabled={processingId === item._id}
              >
                {processingId === item._id ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.completeText}>
                    Mark as Completed
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const StatusBadge = ({ status }) => {
  const lower = status?.toLowerCase();

  let backgroundColor = colors.card;

  if (lower === "completed" || lower === "delivered") backgroundColor = colors.success;
  else if (lower === "assigned" || lower === "accepted" || lower === "picked_up" || lower === "out_for_delivery") backgroundColor = colors.primary;
  else backgroundColor = colors.warning;

  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      <Text style={styles.statusText}>
        {status?.replace(/_/g, " ").toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },

  type: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: colors.text,
  },

  description: {
    fontSize: 15,
    marginBottom: 10,
    color: colors.muted,
  },

  info: {
    fontSize: 14,
    marginBottom: 6,
    color: colors.muted,
  },

  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 10,
  },

  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },

  completeButton: {
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
  },

  completeText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },

  emptyText: {
    fontSize: 18,
    color: colors.muted,
  },
});
