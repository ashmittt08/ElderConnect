import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../config/firebase";
import api from "../api";
import { Picker } from "@react-native-picker/picker";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#3B82F6",
  danger: "#DC2626",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function CreateRequest({ navigation }) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!type || !description) {
      Platform.OS === "web"
        ? alert("Please fill all fields")
        : Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();

      await api.post(
        "/elder/request",
        {
          type: type.toLowerCase(),
          description,
        }
      );

      Platform.OS === "web"
        ? alert("Request submitted successfully")
        : Alert.alert("Success", "Request submitted successfully");

      navigation.goBack();
    } catch (err) {
      console.log("CREATE REQUEST ERROR:", err);
      Platform.OS === "web"
        ? alert("Failed to submit request")
        : Alert.alert("Error", "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>
          Create Help Request
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            Select Request Type
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={type}
              onValueChange={(value) => setType(value)}
              dropdownIconColor={colors.text}
              style={styles.picker}
            >
              <Picker.Item label="Select Type" value="" />
              <Picker.Item label="Medicine" value="medicine" />
              <Picker.Item label="Food" value="food" />
              <Picker.Item label="Emergency" value="emergency" />
            </Picker>
          </View>

          <Text style={styles.label}>
            Describe Your Need
          </Text>

          <TextInput
            placeholder="Explain what you need..."
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            style={styles.textArea}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            type === "emergency" && styles.emergencyButton,
          ]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>
              {type === "emergency"
                ? "🚨 Submit Emergency Request"
                : "Submit Request"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },

  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 25,
  },

  card: {
    backgroundColor: colors.card,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 30,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },

  pickerContainer: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },

  picker: {
    color: colors.text,
    height: 55,
    width: "100%",
  },

  textArea: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: "#020000",
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    textAlignVertical: "top",
  },

  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },

  emergencyButton: {
    backgroundColor: colors.danger,
  },

  submitText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
