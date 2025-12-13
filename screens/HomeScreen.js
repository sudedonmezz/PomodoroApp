import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useState, useEffect } from "react";
import { Text, TouchableHighlight, View, StyleSheet } from "react-native";
import CircularProgress from "../components/CircularProgress"; 

export default function HomeScreen() {
  const totalTime = 25 * 60; 
  const [time, setTime] = useState(totalTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer;
    if (isRunning && time > 0) {
      timer = setInterval(() => setTime((prevTime) => prevTime - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, time]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const progress = (totalTime - time) / totalTime;

  return (
    <View style={styles.container}>
      {/* Circular Progress */}
      <CircularProgress size={220} strokeWidth={14} progress={progress} color="#ffffffff" />

      
      <Text style={styles.timerText}>{formatTime(time)}</Text>

      {/* Start/Pause Button */}
      <TouchableHighlight
        style={styles.button}
        onPress={() => setIsRunning(!isRunning)}
      >
        <Text style={styles.buttonText}>{isRunning ? "Pause" : "Start"}</Text>
      </TouchableHighlight>

      {/* Reset Button */}
      <TouchableHighlight
        style={styles.button}
        onPress={() => setTime(totalTime)}
      >
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f85454ff",
  },
  timerText: {
    fontSize: 48,
    marginVertical: 20,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#000000ff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: "#ffffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});