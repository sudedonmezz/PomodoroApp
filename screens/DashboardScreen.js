import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function DashboardScreen() {
  const [sessions, setSessions] = useState([]);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      orderBy("finishedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSessions(list);

      const total = list.reduce(
        (sum, s) => sum + (s.durationSeconds || 0),
        0
      );
      setTotalSeconds(total);
    });

    return () => unsub();
  }, []);

  const formatMinutes = (seconds) => {
    return Math.floor(seconds / 60);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      {/* TOPLAM */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Toplam Odak Süresi</Text>
        <Text style={styles.bigText}>{formatMinutes(totalSeconds)} dk</Text>
      </View>

      {/* SESSION LİSTESİ */}
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10 }}
        ListEmptyComponent={
          <Text style={{ marginTop: 20 }}>Henüz kayıt yok</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.sessionRow}>
            <Text style={styles.sessionText}>
              ⏱ {formatMinutes(item.durationSeconds)} dk
            </Text>
            <Text style={styles.sessionSub}>
              {item.finishedAt?.toDate?.().toLocaleString() ?? ""}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  bigText: {
    fontSize: 28,
    fontWeight: "900",
  },
  sessionRow: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 10,
  },
  sessionText: {
    fontSize: 16,
    fontWeight: "700",
  },
  sessionSub: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
