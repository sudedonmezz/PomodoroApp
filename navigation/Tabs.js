import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Üst başlığı göstermek istersen true
        tabBarActiveTintColor: "#f85454ff",
        tabBarInactiveTintColor: '#000000ff',
        tabBarStyle: { height: 60,backgroundColor:'#fdfdfdff' },
        tabBarLabelStyle: { paddingBottom: 6, fontSize: 12 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Ana Sayfa') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Ana Sayfa"
        component={HomeScreen}
        options={{ title: 'Home Page' }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </Tab.Navigator>
  );
}