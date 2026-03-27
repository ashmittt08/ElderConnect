import { Text, View } from "react-native";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Greeting() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const displayName = user.name || user.email;

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Welcome, {displayName}
      </Text>
      <Text style={{ color: "gray" }}>
        Role: {user.role.toUpperCase()}
      </Text>
    </View>
  );
}
