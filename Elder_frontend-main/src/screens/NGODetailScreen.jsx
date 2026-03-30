import { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import api from "../api";
import useResponsive from "../hooks/useResponsive";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#4799EB",
  success: "#22C55E",
  text: "#F1F5F9",
  muted: "#94A3B8",
  danger: "#EF4444",
};

export default function NGODetailScreen({ route, navigation }) {
  const { ngoId, ngoName } = route.params;
  const { user } = useContext(AuthContext);
  const responsive = useResponsive();
  
  const [activeTab, setActiveTab] = useState("volunteers");
  const [members, setMembers] = useState({ volunteers: [], elders: [] });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.get(`/ngo/details/${ngoId}/members`);
      setMembers(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setErrorMsg("Access Denied: You must join this NGO to see its members.");
      } else {
        console.error("NGO MEMBERS FETCH ERROR:", err.response?.data || err);
        setErrorMsg("Failed to load members. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [ngoId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        {item.profilePhoto ? (
          <Image source={{ uri: item.profilePhoto }} style={styles.memberImage} />
        ) : (
          <Text style={styles.memberAvatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
        {item.phone && <Text style={styles.memberPhone}>{item.phone}</Text>}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  const currentList = activeTab === "volunteers" ? members.volunteers : members.elders;

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ngoName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "volunteers" && styles.activeTab]}
            onPress={() => setActiveTab("volunteers")}
          >
            <Text style={[styles.tabText, activeTab === "volunteers" && styles.activeTabText]}>
              Volunteers ({members.volunteers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "elders" && styles.activeTab]}
            onPress={() => setActiveTab("elders")}
          >
            <Text style={[styles.tabText, activeTab === "elders" && styles.activeTabText]}>
              Elders ({members.elders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={currentList}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderMember}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, errorMsg && { color: colors.danger, fontWeight: 'bold' }]}>
                {errorMsg || `No ${activeTab} linked to this NGO yet.`}
              </Text>
              {errorMsg && (
                <TouchableOpacity 
                  style={styles.retryBtn}
                  onPress={() => navigation.navigate("NGOsScreen")}
                >
                  <Text style={styles.retryBtnText}>Go to Partner NGOs</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { 
    flexDirection: "row", alignItems: "center", padding: 16, 
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg 
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backBtnText: { color: colors.text, fontSize: 24 },
  headerTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: "bold", textAlign: "center" },
  content: { flex: 1 },
  tabs: { 
    flexDirection: "row", padding: 16, gap: 12, 
    borderBottomWidth: 1, borderBottomColor: colors.border
  },
  tab: { 
    flex: 1, paddingVertical: 10, borderRadius: 8, 
    backgroundColor: colors.card, alignItems: "center",
    borderWidth: 1, borderColor: colors.border
  },
  activeTab: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.muted, fontWeight: "600" },
  activeTabText: { color: "#FFF" },
  listContainer: { padding: 16, gap: 12 },
  memberCard: { 
    flexDirection: "row", backgroundColor: colors.card, padding: 12, 
    borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border
  },
  memberAvatar: { 
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#334155", 
    justifyContent: "center", alignItems: "center", marginRight: 12, overflow: "hidden"
  },
  memberImage: { width: "100%", height: "100%" },
  memberAvatarText: { color: colors.text, fontSize: 18, fontWeight: "bold" },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { color: colors.text, fontSize: 16, fontWeight: "600" },
  memberEmail: { color: colors.muted, fontSize: 12 },
  memberPhone: { color: colors.success, fontSize: 12 },
  emptyState: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: { 
    backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 
  },
  retryBtnText: { color: "#FFF", fontWeight: "bold" },
});
