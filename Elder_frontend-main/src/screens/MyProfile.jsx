import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useContext, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#3B82F6",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

export default function MyProfile() {
  const { user, login, loading } = useContext(AuthContext);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [idImage, setIdImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    if (!user && !loading) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setGender(user.gender || "");
      setEmergencyContact(user.emergencyContact || "");
    }
  }, [user]);

  if (loading || !user) return null;

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission required!");
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

    if (!result.canceled) {
      setIdImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!idImage) return null;

    const data = new FormData();

    data.append("file", {
      uri: idImage,
      type: "image/jpeg",
      name: "id.jpg",
    });

    data.append("upload_preset", "elder_verify");
    data.append("cloud_name", "rishisharma");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/rishisharma/image/upload",
      { method: "POST", body: data }
    );

    const json = await res.json();
    return json.secure_url;
  };

  const saveProfile = async () => {
    try {
      setUploading(true);
      const token = await auth.currentUser.getIdToken(true);

      let imageUrl = null;
      if (idImage) imageUrl = await uploadImage();

      const res = await axios.put(
        "http://localhost:5000/auth/update-profile",
        {
          phone,
          address,
          gender,
          emergencyContact,
          idFrontUrl: imageUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      login(res.data);
      alert("Profile updated successfully");
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  const status = user?.verification?.status || "not_verified";

  const getStatusColor = () => {
    if (status === "approved") return colors.success;
    if (status === "rejected") return colors.danger;
    return colors.warning;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>My Profile</Text>

        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{user?.role}</Text>
        </View>

        {/* Editable Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <TextInput
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            placeholderTextColor={colors.muted}
          />

          <TextInput
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            placeholderTextColor={colors.muted}
          />

          <TextInput
            placeholder="Gender"
            value={gender}
            onChangeText={setGender}
            style={styles.input}
            placeholderTextColor={colors.muted}
          />

          {user?.role === "elder" && (
            <TextInput
              placeholder="Emergency Contact"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
          )}
        </View>

        {/* Upload ID */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Government ID</Text>

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadText}>Upload ID</Text>
          </TouchableOpacity>

          {idImage && (
            <Image
              source={{ uri: idImage }}
              style={styles.imagePreview}
            />
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveProfile}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveText}>Save Profile</Text>
          )}
        </TouchableOpacity>

        {/* Verification Status */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verification Status</Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor() },
            ]}
          >
            <Text style={styles.statusText}>
              {status.replace("_", " ").toUpperCase()}
            </Text>
          </View>

          {status === "rejected" && (
            <Text style={styles.rejectionText}>
              {user?.verification?.rejectionReason}
            </Text>
          )}
        </View>
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
    padding: 24,
  },

  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 20,
  },

  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
    color: colors.text,
  },

  label: {
    color: colors.muted,
    marginTop: 8,
  },

  value: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    marginBottom: 12,
    color: colors.text,
  },

  uploadButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  uploadText: {
    color: "#FFF",
    fontWeight: "600",
  },

  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 14,
  },

  saveButton: {
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  saveText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },

  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  statusText: {
    color: "#FFF",
    fontWeight: "600",
  },

  rejectionText: {
    color: colors.danger,
    marginTop: 10,
  },
});
