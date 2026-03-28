import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  text: "#F1F5F9",
  muted: "#94A3B8",
  blue: "#3B82F6",
  green: "#16A34A",
  yellow: "#F59E0B",
};

export default function RoleSelectScreen({ navigation }) {
  const selectRole = (role) => {
    navigation.navigate("Signup", { role });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          Select how you want to use Elder Connect
        </Text>

        {/* Elder */}
        <TouchableOpacity
          style={[styles.card, { borderColor: colors.blue }]}
          onPress={() => selectRole("elder")}
          activeOpacity={0.85}
        >
          <Text style={styles.icon}>🧓</Text>
          <Text style={styles.cardTitle}>Elder</Text>
          <Text style={styles.cardText}>
            Request help, food, or medical assistance
          </Text>
        </TouchableOpacity>

        {/* Volunteer */}
        <TouchableOpacity
          style={[styles.card, { borderColor: colors.green }]}
          onPress={() => selectRole("volunteer")}
          activeOpacity={0.85}
        >
          <Text style={styles.icon}>🤝</Text>
          <Text style={styles.cardTitle}>Volunteer</Text>
          <Text style={styles.cardText}>
            Help elders and support your community
          </Text>
        </TouchableOpacity>

        {/* NGO */}
        <TouchableOpacity
          style={[styles.card, { borderColor: colors.yellow }]}
          onPress={() => selectRole("ngo")}
          activeOpacity={0.85}
        >
          <Text style={styles.icon}>🏢</Text>
          <Text style={styles.cardTitle}>NGO</Text>
          <Text style={styles.cardText}>
            Manage requests and coordinate support
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: colors.text,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    color: colors.muted,
  },

  card: {
    backgroundColor: colors.card,
    padding: 25,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    alignItems: "center",

    // subtle elevation
    ...(Platform.OS === "web"
      ? { cursor: "pointer" }
      : {}),
  },

  icon: {
    fontSize: 40,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 6,
  },

  cardText: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
  },
});
