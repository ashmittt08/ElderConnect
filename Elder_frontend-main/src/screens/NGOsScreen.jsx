import { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
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

export default function NGOsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Volunteer's joined NGOs aren't populated here directly, but let's assume if it fails it's joined.
  // Actually, we can fetch user profile to get joinedNGOs or joinedNGO.
  const [myProfile, setMyProfile] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = user.role === "elder" ? "/elder/ngos" : "/volunteer/ngos";
      const [ngosRes, profileRes] = await Promise.all([
        api.get(endpoint),
        api.get("/auth/me") 
      ]);
      setNgos(ngosRes.data);
      setMyProfile(profileRes.data);
    } catch (err) {
      console.error("NGO FETCH ERROR:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoinNGO = async (ngoId) => {
    try {
      const endpoint = user.role === "elder" ? `/elder/join-ngo/${ngoId}` : `/volunteer/join-ngo/${ngoId}`;
      await api.post(endpoint);
      Alert.alert("Success", "Successfully joined the NGO!");
      fetchData(); // Refresh to update button states
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to join NGO");
    }
  };

  const isJoined = (ngoId) => {
    if (!myProfile) return false;
    if (user.role === "elder") {
      return myProfile.joinedNGO === ngoId;
    }
    if (user.role === "volunteer") {
      return myProfile.joinedNGOs?.includes(ngoId);
    }
    return false;
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
        <Text style={styles.heading}>Partner NGOs</Text>
        <Text style={styles.subheading}>Explore and join NGOs in your area</Text>

        <View style={styles.list}>
          {ngos.length > 0 ? (
            ngos.map((ngo) => {
              const joined = isJoined(ngo._id);
              return (
                <View key={ngo._id} style={styles.card}>
                  <View style={styles.avatar}>
                    {ngo.profilePhoto ? (
                      <Image source={{ uri: ngo.profilePhoto }} style={styles.image} />
                    ) : (
                      <Text style={styles.avatarText}>{ngo.name?.charAt(0)?.toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{ngo.name}</Text>
                    <Text style={styles.address}>📍 {ngo.address || "Address not provided"}</Text>
                    {ngo.phone && <Text style={styles.phone}>📞 {ngo.phone}</Text>}
                  </View>
                  <TouchableOpacity 
                    style={[styles.joinBtn, joined && styles.joinedBtn]} 
                    disabled={joined || (user.role === "elder" && myProfile?.joinedNGO && !joined)}
                    onPress={() => handleJoinNGO(ngo._id)}
                  >
                    <Text style={styles.joinText}>{joined ? "Joined" : "Join"}</Text>
                  </TouchableOpacity>
                </View>
              )
            })
          ) : (
            <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 20 }}>No FAQs/NGOs found.</Text>
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
  list: { gap: 15 },
  card: {
    flexDirection: "row", backgroundColor: colors.card, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center"
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: "#334155", 
    justifyContent: "center", alignItems: "center", marginRight: 15, overflow: "hidden"
  },
  image: { width: "100%", height: "100%" },
  avatarText: { fontSize: 20, color: colors.text, fontWeight: "bold" },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: "bold", color: colors.text },
  address: { fontSize: 13, color: colors.muted },
  phone: { fontSize: 13, color: colors.success },
  joinBtn: {
    backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8
  },
  joinedBtn: { backgroundColor: colors.success, opacity: 0.8 },
  joinText: { color: "#FFF", fontWeight: "600", fontSize: 14 }
});
