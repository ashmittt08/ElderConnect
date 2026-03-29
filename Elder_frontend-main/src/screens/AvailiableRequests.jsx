import { useEffect, useState } from "react";
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

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#3B82F6",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function AvailableRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        const res = await api.get(
          "/volunteer/requests"
        );

        setRequests(res.data);
      } catch (err) {
        console.error("FETCH REQUESTS ERROR:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const acceptRequest = async (id) => {
    try {
      setProcessingId(id);
      const token = await auth.currentUser.getIdToken();

      await api.post(
        `/volunteer/accept/${id}`,
        {}
      );

      Alert.alert("Success", "Request accepted!");
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("ACCEPT ERROR:", err.response?.data || err);
      Alert.alert("Error", "Failed to accept request");
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

  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>
          No available requests right now.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Type */}
            <Text style={styles.type}>
              {item.type?.toUpperCase()}
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              {item.description}
            </Text>

            {/* Elder Info */}
            <Text style={styles.info}>
              👤 {item.elder?.name || item.elder?.email || "N/A"}
            </Text>

            <Text style={styles.info}>
              📞 {item.elder?.phone || "N/A"}
            </Text>

            {/* Accept Button */}
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => acceptRequest(item._id)}
              disabled={processingId === item._id}
            >
              {processingId === item._id ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.acceptText}>
                  Accept Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },

  type: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: colors.text,
  },

  description: {
    fontSize: 15,
    marginBottom: 12,
    color: colors.muted,
  },

  info: {
    fontSize: 14,
    marginBottom: 6,
    color: colors.muted,
  },

  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
  },

  acceptText: {
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
