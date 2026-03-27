import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { auth } from "../config/firebase";

const colors = {
  bg: "#0F172A",
  sidebar: "#0B1220",
  card: "#1E293B",
  border: "#334155",
  text: "#F1F5F9",
  muted: "#94A3B8",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
};

export default function NGOVolunteers({ navigation }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        const res = await axios.get(
          "http://localhost:5000/ngo/volunteers",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setVolunteers(res.data);
      } catch (err) {
        console.error("FETCH NGO VOLUNTEERS ERROR:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  if (volunteers.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>No volunteers registered.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={volunteers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => {
          const status = item.verification?.status || "Not Verified";

          const statusColor =
            status === "approved"
              ? colors.success
              : status === "rejected"
                ? colors.danger
                : status === "not_verified"
                  ? "#64748B"
                  : colors.warning;

          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.name}>{item.name || "Volunteer"}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>

                <View
                  style={[styles.statusBadge, { backgroundColor: statusColor }]}
                >
                  <Text style={styles.statusText}>
                    {status === "not_verified"
                      ? "NOT VERIFIED"
                      : status.replace("_", " ").toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  card: {
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },

  email: {
    fontSize: 14,
    color: colors.muted,
  },

  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
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
