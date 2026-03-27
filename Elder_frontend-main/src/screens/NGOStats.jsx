import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { auth } from "../config/firebase";

export default function NGOStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        const res = await axios.get(
          "http://localhost:5000/ngo/stats",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setStats(res.data);
      } catch (err) {
        console.log("NGO STATS ERROR:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>NGO Dashboard Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.elderCard]}>
            <Text style={styles.statNumber}>
              {stats?.elders || 0}
            </Text>
            <Text style={styles.statLabel}>Registered Elders</Text>
          </View>

          <View style={[styles.statCard, styles.volunteerCard]}>
            <Text style={styles.statNumber}>
              {stats?.volunteers || 0}
            </Text>
            <Text style={styles.statLabel}>Active Volunteers</Text>
          </View>

          <View style={[styles.statCard, styles.requestCard]}>
            <Text style={styles.statNumber}>
              {stats?.requests || 0}
            </Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#1E293B",
  },

  statsGrid: {
    flexDirection: "column",
    gap: 20,
  },

  statCard: {
    padding: 28,
    borderRadius: 18,
    elevation: 5,
    alignItems: "center",
  },

  elderCard: {
    backgroundColor: "#DBEAFE",
  },

  volunteerCard: {
    backgroundColor: "#DCFCE7",
  },

  requestCard: {
    backgroundColor: "#FEF3C7",
  },

  statNumber: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#1E293B",
  },

  statLabel: {
    fontSize: 18,
    marginTop: 8,
    color: "#334155",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
});
