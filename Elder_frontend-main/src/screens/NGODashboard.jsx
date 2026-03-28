import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { auth } from "../config/firebase";
import useResponsive from "../hooks/useResponsive";

const colors = {
  bg: "#0F172A",
  sidebar: "#0B1220",
  card: "#1E293B",
  border: "#334155",
  primary: "#3B82F6",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function NGODashboard({ navigation }) {
  const user = useContext(AuthContext);

  const [volunteerCount, setVolunteerCount] = useState(0);
  const [openRequests, setOpenRequests] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const responsive = useResponsive();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        const statsRes = await axios.get(
          "http://localhost:5000/ngo/stats",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setVolunteerCount(statsRes.data.volunteers);
        setOpenRequests(statsRes.data.openRequests);
        setCompletedCount(statsRes.data.completedTasks);


        const completedRes = await axios.get(
          "http://localhost:5000/ngo/completed",
          { headers: { Authorization: `Bearer ${token}` } },
        );

        setVolunteerCount(statsRes.data.volunteers);
        setCompletedCount(statsRes.data.completedTasks);
        setRecent(completedRes.data);
      } catch (err) {
        console.log("NGO DASHBOARD ERROR:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading)
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}>
        {responsive.showSidebar && (
          <View style={styles.sidebar}>
            <Text style={styles.logo}>ElderConnect</Text>
            <Text style={styles.hub}>NGO Hub</Text>

            <SidebarItem label="Dashboard" active />
            <SidebarItem
              label="Volunteers"
              onPress={() => navigation.navigate("NGOVolunteers")}
            />
            <SidebarItem
              label="Available Requests"
              onPress={() => navigation.navigate("NGORequests")}
            />
          </View>
        )}

        <ScrollView style={styles.content}>
          <Text style={styles.heading}>Dashboard</Text>
          <Text style={styles.subheading}>
            Overview of activities and performance
          </Text>

          <Text style={styles.sectionTitle}>Key Metrics</Text>

          <View style={[styles.metricsRow, { flexDirection: responsive.isMobile ? "column" : "row" }]}>
            <MetricCard
              title="Active Volunteers"
              value={volunteerCount}
            />

            <MetricCard
              title="Open Requests"
              value={openRequests}
            />

            <MetricCard
              title="Completed Tasks"
              value={completedCount}
            />
          </View>


          <Text style={styles.sectionTitle}>Recent Activities</Text>

          <Table
            headers={["Elder", "Type", "Volunteer", "Status"]}
            rows={
              recent.length > 0
                ? recent.map((r) => [
                  r.elder?.name || "N/A",
                  r.type || "N/A",
                  r.volunteer?.name || "N/A",
                  "Completed",
                ])
                : [["No completed tasks yet", "", "", ""]]
            }
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const SidebarItem = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.sidebarItem, active && { backgroundColor: colors.card }]}
  >
    <Text style={styles.sidebarText}>{label}</Text>
  </TouchableOpacity>
);

const MetricCard = ({ title, value }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const Table = ({ headers, rows }) => (
  <View style={styles.table}>
    <View style={styles.tableHeader}>
      {headers.map((h, i) => (
        <Text key={i} style={styles.tableHeaderText}>
          {h}
        </Text>
      ))}
    </View>

    {rows.map((row, i) => (
      <View key={i} style={styles.tableRow}>
        {row.map((cell, j) => (
          <View key={j} style={styles.cell}>
            <Text style={styles.cellText}>{cell}</Text>
          </View>
        ))}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  layout: {
    flex: 1,
  },
  sidebar: {
    width: 250,
    backgroundColor: colors.sidebar,
    padding: 20,
  },
  logo: { fontSize: 20, fontWeight: "bold", color: colors.text },
  hub: { color: colors.muted, marginBottom: 30 },
  sidebarItem: { padding: 12, borderRadius: 10, marginBottom: 8 },
  sidebarText: { color: colors.text },
  content: { flex: 1, padding: 24 },
  heading: { fontSize: 28, fontWeight: "bold", color: colors.text },
  subheading: { color: colors.muted, marginBottom: 25 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 15,
    marginTop: 20,
  },
  metricsRow: {
    gap: 15,
    marginBottom: 30,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricTitle: { color: colors.muted, marginBottom: 10 },
  metricValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.text,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.card,
    padding: 12,
  },
  tableHeaderText: {
    flex: 1,
    color: colors.muted,
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  cell: { flex: 1 },
  cellText: { color: colors.text },
});
