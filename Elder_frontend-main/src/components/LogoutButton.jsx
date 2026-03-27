import { Text, TouchableOpacity, Platform, Alert } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

export default function LogoutButton() {
  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Do you want to sign out?");
      if (!confirmed) return;
      await signOut(auth);
    } else {
      Alert.alert(
        "Sign out",
        "Do you want to sign out?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign out",
            style: "destructive",
            onPress: async () => {
              await signOut(auth);
            },
          },
        ]
      );
    }
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 12 }}>
      <Text style={{ color: "red", fontWeight: "600" }}>
        Sign Out
      </Text>
    </TouchableOpacity>
  );
}
