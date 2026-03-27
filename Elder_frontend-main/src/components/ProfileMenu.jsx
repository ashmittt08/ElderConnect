import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";

export default function ProfileMenu() {
  const [visible, setVisible] = useState(false);
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleLogout = async () => {
    await signOut(auth);
    setVisible(false);
  };

  return (
    <>
      {/* Avatar Button */}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#4f46e5",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          {getInitials(user?.name)}
        </Text>
      </TouchableOpacity>

      {/* Dropdown */}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
          onPress={() => setVisible(false)}
        >
          <View
            style={{
              position: "absolute",
              top: 60,
              right: 10,
              backgroundColor: "white",
              borderRadius: 8,
              padding: 10,
              width: 150,
              elevation: 5,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setVisible(false);
                navigation.navigate("MyProfile");
              }}
              style={{ paddingVertical: 10 }}
            >
              <Text>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={{ paddingVertical: 10 }}
            >
              <Text style={{ color: "red" }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
