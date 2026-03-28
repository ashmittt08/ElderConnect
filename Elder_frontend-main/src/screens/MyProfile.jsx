import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
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
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
      setProfilePhoto(user.profilePhoto || null);
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

    if (Platform.OS === "web") {
      const res = await fetch(idImage);
      const blob = await res.blob();
      data.append("file", blob);
    } else {
      data.append("file", {
        uri: idImage,
        type: "image/jpeg",
        name: "id.jpg",
      });
    }

    data.append("upload_preset", "elder_verify");
    data.append("cloud_name", "rishisharma");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/rishisharma/image/upload",
      { method: "POST", body: data }
    );

    const json = await res.json();
    return json.secure_url;
  };

  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      aspect: [1, 1], // Square aspect ratio for profile photo
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async () => {
    if (!profilePhoto || profilePhoto.startsWith("http")) return profilePhoto; // Already uploaded

    const data = new FormData();
    
    if (Platform.OS === "web") {
      const res = await fetch(profilePhoto);
      const blob = await res.blob();
      data.append("file", blob);
    } else {
      data.append("file", {
        uri: profilePhoto,
        type: "image/jpeg",
        name: "profile.jpg",
      });
    }

    data.append("upload_preset", "elder_verify");
    data.append("cloud_name", "rishisharma");

    const res = await fetch("https://api.cloudinary.com/v1_1/rishisharma/image/upload", {
      method: "POST",
      body: data,
    });
    const json = await res.json();
    return json.secure_url;
  };

  const saveProfile = async () => {
    try {
      setUploading(true);
      const token = await auth.currentUser.getIdToken(true);

      let imageUrl = user.verification?.idFrontUrl || null;
      let finalProfilePhoto = user.profilePhoto;

      if (idImage) imageUrl = await uploadImage();
      
      // Upload profile photo if changed and not a url
      if (profilePhoto && !profilePhoto.startsWith("http")) {
        finalProfilePhoto = await uploadProfileImage();
      } else if (profilePhoto) {
         finalProfilePhoto = profilePhoto;
      }

      const res = await axios.put(
        "http://localhost:5000/auth/update-profile",
        {
          phone,
          address,
          gender,
          emergencyContact,
          idFrontUrl: imageUrl,
          profilePhoto: finalProfilePhoto,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      login(res.data);
      setIsEditing(false);
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

        {/* Profile Avatar Selection */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            onPress={isEditing ? pickProfilePhoto : null} 
            style={styles.avatarContainer}
            disabled={!isEditing}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            )}
            {isEditing && (
              <View style={styles.editAvatarBadge}>
                <Text style={styles.editAvatarIcon}>✏️</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

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

          {isEditing ? (
            <TextInput
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
          ) : (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{phone || "Not set"}</Text>
            </View>
          )}

          {isEditing ? (
            <TextInput
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
          ) : (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{address || "Not set"}</Text>
            </View>
          )}

          {isEditing ? (
            <TextInput
              placeholder="Gender"
              value={gender}
              onChangeText={setGender}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
          ) : (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.value}>{gender || "Not set"}</Text>
            </View>
          )}

          {user?.role === "elder" && (
            isEditing ? (
              <TextInput
                placeholder="Emergency Contact"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                style={styles.input}
                placeholderTextColor={colors.muted}
              />
            ) : (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Emergency Contact</Text>
                <Text style={styles.value}>{emergencyContact || "Not set"}</Text>
              </View>
            )
          )}
        </View>

        {/* Upload ID */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Government ID</Text>

          {isEditing && (
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadText}>{idImage || user?.verification?.idFrontUrl ? "Change ID" : "Upload ID"}</Text>
            </TouchableOpacity>
          )}

          {idImage ? (
            <Image source={{ uri: idImage }} style={styles.imagePreview} />
          ) : user?.verification?.idFrontUrl ? (
            <Image source={{ uri: user.verification.idFrontUrl }} style={styles.imagePreview} />
          ) : (
            !isEditing && <Text style={styles.value}>No ID uploaded</Text>
          )}
        </View>

        {/* Action Buttons */}
        {isEditing ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.saveButton, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                setPhone(user.phone || "");
                setAddress(user.address || "");
                setGender(user.gender || "");
                setEmergencyContact(user.emergencyContact || "");
                setProfilePhoto(user.profilePhoto || null);
                setIdImage(null);
              }}
              disabled={uploading}
            >
              <Text style={styles.saveText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, styles.submitButton]}
              onPress={saveProfile}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.saveText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

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

  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },

  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.border,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },

  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.border,
  },

  avatarPlaceholderText: {
    fontSize: 40,
    color: colors.text,
    fontWeight: "bold",
  },

  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: -5,
    backgroundColor: colors.card,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },

  editAvatarIcon: {
    fontSize: 14,
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
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: colors.border,
  },

  submitButton: {
    flex: 2,
    backgroundColor: colors.success,
  },

  editProfileBtn: {
    backgroundColor: colors.primary,
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
  
  detailRow: {
    marginBottom: 10,
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
