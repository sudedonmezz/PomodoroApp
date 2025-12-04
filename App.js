import { NavigationContainer } from '@react-navigation/native';
import Tabs from './navigation/Tabs';
import './firebaseConfig';
import { View, Button, Text } from 'react-native';
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export default function App() {
  return (
    <NavigationContainer>
      <Tabs />
    </NavigationContainer>
  );
}

