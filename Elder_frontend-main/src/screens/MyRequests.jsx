import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { auth } from "../config/firebase";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  text: "#F1F5F9",
  muted: "#94A3B8",
  green: "#16A34A",
  red: "#DC2626",
  yellow: "#F59E0B",
};

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        const res = await axios.get(
          "http://localhost:5000/elder/requests",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setRequests(res.data);
      } catch (error) {
        console.log("FETCH REQUEST ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const renderItem = ({ item }) => {
    const statusStyle =
      item.status === "approved"
        ? styles.approved
        : item.status === "rejected"
          ? styles.rejected
          : styles.pending;

    return (
      <View style={styles.card}>
        <Text style={styles.type}>
          {item.type?.toUpperCase()}
        </Text>

        <Text style={styles.description}>
          {item.description}
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={styles.statusText}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>
          No requests submitted yet
        </Text>
        <Text style={styles.emptySub}>
          Your help requests will appear here.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 25 }}
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
    padding: 20,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  type: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: 15,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusLabel: {
    color: colors.muted,
    fontSize: 14,
  },

  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },

  approved: {
    backgroundColor: colors.green,
  },

  rejected: {
    backgroundColor: colors.red,
  },

  pending: {
    backgroundColor: colors.yellow,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },

  emptyTitle: {
    fontSize: 20,
    color: colors.text,
    marginBottom: 8,
  },

  emptySub: {
    color: colors.muted,
  },
});
