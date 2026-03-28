import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import axios from "axios";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#3B82F6",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function SignupScreen({ route, navigation }) {
  const { role } = route.params;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const token = await res.user.getIdToken(true);

      await axios.post(
        "http://localhost:5000/auth/register",
        { token, role, name }
      );

      Alert.alert(
        "Registration Successful 🎉",
        "Your account has been created successfully. Please login to continue.",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              }),
          },
        ]
      );
    } catch (err) {
      console.log("FULL BACKEND ERROR:", err.response?.data || err);
      Alert.alert("Signup Failed", "Something went wrong. Try again.");
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
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {role === "ngo"
              ? "Register Organization"
              : "Create Account"}
          </Text>

          <Text style={styles.subtitle}>
            {role === "ngo"
              ? "Join Elder Connect as an NGO"
              : "Join Elder Connect today"}
          </Text>

          <View style={styles.card}>
            <TextInput
              placeholder={
                role === "ngo"
                  ? "Organization Name"
                  : "Full Name"
              }
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />

            <TextInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor={colors.muted}
            />

            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />

            <TextInput
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={signup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.signupText}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    padding: 30,
    justifyContent: "center",
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: colors.text,
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 30,
    color: colors.muted,
  },

  card: {
    backgroundColor: colors.card,
    padding: 25,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 30,
  },

  input: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 18,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },

  signupButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },

  signupText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
