import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { auth } from "../config/firebase";

export default function AssignVolunteer({ route, navigation }) {
  const requestId = route?.params?.requestId;

  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        const res = await axios.get(
          "http://localhost:5000/ngo/volunteers",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setVolunteers(res.data);
      } catch (err) {
        console.error("FETCH VOLUNTEERS ERROR:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);

  const assign = async (volunteerId) => {
    try {
      setProcessingId(volunteerId);

      const token = await auth.currentUser.getIdToken();

      await axios.post(
        "http://localhost:5000/ngo/assign",
        { requestId, volunteerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Volunteer assigned successfully ✅");
      navigation.goBack();
    } catch (err) {
      console.error("ASSIGN ERROR:", err.response?.data || err);
      alert("Failed to assign volunteer");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (volunteers.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>
          No volunteers available.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={volunteers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          const status = item.verification?.status || "not_uploaded";

          const statusStyle =
            status === "approved"
              ? styles.approved
              : status === "rejected"
                ? styles.rejected
                : styles.pending;

          return (
            <View style={styles.card}>
              <Text style={styles.name}>
                {item.name || "Volunteer"}
              </Text>

              <Text style={styles.email}>
                {item.email}
              </Text>

              <Text style={[styles.status, statusStyle]}>
                Verification: {status.replace("_", " ").toUpperCase()}
              </Text>

              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => assign(item._id)}
                disabled={processingId === item._id}
              >
                {processingId === item._id ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.assignText}>
                    Assign Volunteer
                  </Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: "#F8FAFC",
  },

  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 18,
    marginBottom: 15,
    elevation: 5,
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#1E293B",
  },

  email: {
    fontSize: 16,
    marginBottom: 8,
    color: "#475569",
  },

  status: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },

  approved: {
    color: "#16A34A",
  },

  rejected: {
    color: "#DC2626",
  },

  pending: {
    color: "#F59E0B",
  },

  assignButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  assignText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  emptyText: {
    fontSize: 20,
    color: "#64748B",
  },
});
