import { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import api from "../api";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#4799EB",
  success: "#22C55E",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function EventsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // For NGO Event Creation
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.error("EVENTS FETCH ERROR:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async () => {
    if (!title || !description || !date || !location) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    try {
      setCreating(true);
      await api.post("/events", { title, description, date, location });
      Alert.alert("Success", "Event created successfully!");
      setTitle(""); setDescription(""); setDate(""); setLocation("");
      fetchEvents();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/join`);
      Alert.alert("Success", "Joined event successfully!");
      fetchEvents();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to join event");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Community Events</Text>
        <Text style={styles.subheading}>Explore and participate in ongoing initiatives</Text>

        {user.role === "ngo" && (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Post a New Event</Text>
            <TextInput style={styles.input} placeholder="Event Title" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Description" placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} multiline />
            <TextInput style={styles.input} placeholder="Date (e.g. 2026-12-01)" placeholderTextColor={colors.muted} value={date} onChangeText={setDate} />
            <TextInput style={styles.input} placeholder="Location" placeholderTextColor={colors.muted} value={location} onChangeText={setLocation} />
            
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateEvent} disabled={creating}>
              <Text style={styles.submitText}>{creating ? "Creating..." : "Create Event"}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.list}>
          {events.length > 0 ? (
            events.map((evt) => {
              const isVolunteerJoined = evt.volunteers?.includes(user._id);

              return (
                <View key={evt._id} style={styles.card}>
                  <View style={styles.info}>
                    <Text style={styles.title}>{evt.title}</Text>
                    <Text style={styles.desc}>{evt.description}</Text>
                    <Text style={styles.meta}>📅 {new Date(evt.date).toDateString()} | 📍 {evt.location}</Text>
                    <Text style={styles.ngoName}>NGO: {evt.ngo?.name}</Text>
                  </View>
                  {user.role === "volunteer" && (
                    <TouchableOpacity 
                      style={[styles.joinBtn, isVolunteerJoined && styles.joinedBtn]} 
                      onPress={() => handleJoinEvent(evt._id)}
                      disabled={isVolunteerJoined}
                    >
                      <Text style={styles.joinText}>{isVolunteerJoined ? "Joined" : "Join to Volunteer"}</Text>
                    </TouchableOpacity>
                  )}
                  {user.role === "elder" && (
                    <View style={styles.elderBadge}>
                      <Text style={styles.elderBadgeText}>You're Invited!</Text>
                    </View>
                  )}
                </View>
              )
            })
          ) : (
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 20 }}>No events found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 5 },
  subheading: { fontSize: 15, color: colors.muted, marginBottom: 20 },
  createCard: { backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  createTitle: { fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 15 },
  input: { backgroundColor: colors.bg, color: colors.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  submitBtn: { backgroundColor: colors.success, padding: 14, borderRadius: 8, alignItems: "center", marginTop: 5 },
  submitText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  list: { gap: 15 },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  info: { gap: 6, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "bold", color: colors.text },
  desc: { fontSize: 14, color: colors.muted },
  meta: { fontSize: 13, color: colors.success, marginTop: 4 },
  ngoName: { fontSize: 13, color: "#94A3B8", fontStyle: "italic" },
  joinBtn: { backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  joinedBtn: { backgroundColor: colors.success, opacity: 0.8 },
  joinText: { color: "#FFF", fontWeight: "bold" },
  elderBadge: { backgroundColor: `${colors.primary}20`, padding: 8, borderRadius: 6, alignSelf: "flex-start" },
  elderBadgeText: { color: colors.primary, fontWeight: "bold", fontSize: 12 }
});
