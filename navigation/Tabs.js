import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import DashboardScreen from "../screens/DashboardScreen";
import { Ionicons } from "@expo/vector-icons";

import { Pressable, Text } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

const Tab = createBottomTabNavigator();

export default function Tabs() {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("signOut error:", e);
    }
  };

  return (
    <Tab.Navigator
      initialRouteName="Ana Sayfa"   // ✅ her zaman Home ile başla
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: "center",
        headerRight: () => (
          <Pressable onPress={handleSignOut} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ fontWeight: "900" }}>Çıkış</Text>
          </Pressable>
        ),
        tabBarActiveTintColor: "#f85454ff",
        tabBarInactiveTintColor: "#000000ff",
        tabBarStyle: { height: 60, backgroundColor: "#fdfdfdff" },
        tabBarLabelStyle: { paddingBottom: 6, fontSize: 12 },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "Ana Sayfa") iconName = focused ? "home" : "home-outline";
          if (route.name === "Dashboard") iconName = focused ? "stats-chart" : "stats-chart-outline";
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
    </Tab.Navigator>
  );
}
