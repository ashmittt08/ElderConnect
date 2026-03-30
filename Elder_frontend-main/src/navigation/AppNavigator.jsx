import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext, useEffect } from "react";
import { ActivityIndicator, View, Alert } from "react-native";

import { AuthContext } from "../context/AuthContext";

import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import RoleSelectScreen from "../screens/RoleSelectScreen";

import ElderDashboard from "../screens/ElderDashboard";
import CompanionScreen from "../screens/CompanionScreen";
import VolunteerDashboard from "../screens/VolunteerDashboard";
import NGODashboard from "../screens/NGODashboard";
import AdminDashboard from "../screens/AdminDashboard";

import CreateRequest from "../screens/CreateRequest";
import MyRequests from "../screens/MyRequests";
import AvailableRequests from "../screens/AvailiableRequests";
import MyTasks from "../screens/MyTasks";

import NGOStats from "../screens/NGOStats";
import NGORequests from "../screens/NGORequests";
import AssignVolunteer from "../screens/AssignVolunteer";
import NGOVolunteers from "../screens/NGOVolunteers";
import ManageUsers from "../screens/ManageUsers";
import AdminUserManagement from "../screens/AdminUserManagement";
import AdminNGOApprovals from "../screens/AdminNGOApprovals";
import AdminActivityMonitoring from "../screens/AdminActivityMonitoring";
import AdminFlaggedReports from "../screens/AdminFlaggedReports";
import ProfileMenu from "../components/ProfileMenu";
import MyProfile from "../screens/MyProfile";
import DeliveryOrderScreen from "../screens/DeliveryOrderScreen";
import DeliveryTrackingScreen from "../screens/DeliveryTrackingScreen";
import DeliveryHistoryScreen from "../screens/DeliveryHistoryScreen";
import VolunteerActiveDelivery from "../screens/VolunteerActiveDelivery";
import NGOsScreen from "../screens/NGOsScreen";
import EventsScreen from "../screens/EventsScreen";
import MyNGOsScreen from "../screens/MyNGOsScreen";
import NGODetailScreen from "../screens/NGODetailScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (user && !user.profileCompleted) {
      Alert.alert(
        "Incomplete Profile",
        "Please complete your profile information.",
        [{ text: "Later" }, { text: "Go to Profile" }],
      );
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: "#0F172A" },
          headerTintColor: "#F1F5F9",
          headerTitleStyle: { color: "#F1F5F9", fontWeight: "700" },
          headerShadowVisible: false,
          headerRight: () => (user ? <ProfileMenu /> : null),
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
          </>
        ) : user.role === "elder" ? (
          <>
            <Stack.Screen name="ElderDashboard" component={ElderDashboard} />
            <Stack.Screen name="CreateRequest" component={CreateRequest} />
            <Stack.Screen name="MyRequests" component={MyRequests} />
            <Stack.Screen name="DeliveryOrderScreen" component={DeliveryOrderScreen} options={{ title: "New Delivery" }} />
            <Stack.Screen name="DeliveryTrackingScreen" component={DeliveryTrackingScreen} options={{ title: "Track Delivery" }} />
            <Stack.Screen name="DeliveryHistoryScreen" component={DeliveryHistoryScreen} options={{ title: "My Deliveries" }} />
            <Stack.Screen name="CompanionScreen" component={CompanionScreen} options={{ title: "AI Companion" }} />
            <Stack.Screen name="NGOsScreen" component={NGOsScreen} options={{ title: "Partner NGOs" }} />
            <Stack.Screen name="MyNGOsScreen" component={MyNGOsScreen} options={{ title: "My NGOs" }} />
            <Stack.Screen name="EventsScreen" component={EventsScreen} options={{ title: "Community Events" }} />
          </>
        ) : user.role === "volunteer" ? (
          <>
            <Stack.Screen
              name="VolunteerDashboard"
              component={VolunteerDashboard}
            />
            <Stack.Screen
              name="AvailableRequests"
              component={AvailableRequests}
            />
            <Stack.Screen name="MyTasks" component={MyTasks} />
            <Stack.Screen name="VolunteerActiveDelivery" component={VolunteerActiveDelivery} options={{ title: "Active Delivery" }} />
            <Stack.Screen name="NGOsScreen" component={NGOsScreen} options={{ title: "Partner NGOs" }} />
            <Stack.Screen name="MyNGOsScreen" component={MyNGOsScreen} options={{ title: "My NGOs" }} />
            <Stack.Screen name="EventsScreen" component={EventsScreen} options={{ title: "Community Events" }} />
          </>
        ) : user.role === "ngo" ? (
          <>
            <Stack.Screen name="NGODashboard" component={NGODashboard} />
            <Stack.Screen name="NGOStats" component={NGOStats} />
            <Stack.Screen name="NGORequests" component={NGORequests} />
            <Stack.Screen name="AssignVolunteer" component={AssignVolunteer} />
            <Stack.Screen
              name="NGOVolunteers"
              component={NGOVolunteers}
              options={{ title: "Volunteers" }}
            />
            <Stack.Screen name="EventsScreen" component={EventsScreen} options={{ title: "Community Events" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="ManageUsers" component={ManageUsers} />
            <Stack.Screen name="AdminUserManagement" component={AdminUserManagement} options={{ title: "User Management" }} />
            <Stack.Screen name="AdminNGOApprovals" component={AdminNGOApprovals} options={{ title: "NGO Approvals" }} />
            <Stack.Screen name="AdminActivityMonitoring" component={AdminActivityMonitoring} options={{ title: "Activity Monitoring" }} />
            <Stack.Screen name="AdminFlaggedReports" component={AdminFlaggedReports} options={{ title: "Pending Verifications" }} />
          </>
        )}
        <Stack.Screen name="MyProfile" component={MyProfile} />
        <Stack.Screen name="NGODetailScreen" component={NGODetailScreen} options={{ title: "NGO Details" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
