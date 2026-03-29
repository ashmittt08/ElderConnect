import { View, Text, FlatList, Button } from "react-native";
import { useEffect, useState } from "react";
import api from "../api";
import { auth } from "../config/firebase";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveNgo = async (id) => {
    await api.post(`/admin/approve-ngo/${id}`, {});
    fetchUsers();
  };

  const toggleBlock = async (id) => {
    await api.post(`/admin/toggle-block/${id}`, {});
    fetchUsers();
  };

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={{ padding: 10, borderBottomWidth: 1 }}>
          <Text>{item.email}</Text>
          <Text>Role: {item.role}</Text>
          <Text>Approved: {String(item.approved)}</Text>

          {item.role === "ngo" && !item.approved && (
            <Button title="Approve NGO" onPress={() => approveNgo(item._id)} />
          )}

          <Button
            title={item.approved ? "Block" : "Unblock"}
            onPress={() => toggleBlock(item._id)}
          />
        </View>
      )}
    />
  );
}
