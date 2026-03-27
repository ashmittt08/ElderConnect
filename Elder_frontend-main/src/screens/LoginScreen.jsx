import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#3B82F6",
  green: "#16A34A",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Wrong email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.wrapper}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Elder Connect</Text>
            <Text style={styles.subtitle}>
              Volunteer & Support Platform
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={login}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => navigation.navigate("RoleSelect")}
            >
              <Text style={styles.signupText}>
                Create New Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  wrapper: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    width: Platform.OS === "web" ? 420 : "100%",
    backgroundColor: colors.card,
    padding: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 30,
  },

  input: {
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 18,
  },

  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  loginText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  signupButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  signupText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
});
