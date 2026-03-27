import { View, Text, FlatList, Button } from "react-native";
import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../config/firebase";

const BASE_URL = "http://localhost:5000";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const token = await auth.currentUser.getIdToken();
    const res = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveNgo = async (id) => {
    const token = await auth.currentUser.getIdToken();
    await axios.post(`${BASE_URL}/admin/approve-ngo/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  const toggleBlock = async (id) => {
    const token = await auth.currentUser.getIdToken();
    await axios.post(`${BASE_URL}/admin/toggle-block/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
