import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "../src/auth/AuthProvider";

export default function DashboardScreen() {
  const { user } = useAuth();
  if (!user) return null;

  const uid = user.uid;

  const summariesRef = collection(db, "users", uid, "session_summaries");
  const categoriesRef = collection(db, "users", uid, "categories");

  const [summaries, setSummaries] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const q = query(summariesRef, orderBy("endedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setSummaries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const q = query(categoriesRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [uid]);

  const categoryNameById = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.id] = c.name;
    return map;
  }, [categories]);

  const toMin = (sec) => Math.floor((sec || 0) / 60);

  const totals = useMemo(() => {
    let w = 0, b = 0;
    for (const s of summaries) {
      w += s.workSeconds || 0;
      b += s.breakSeconds || 0;
    }
    return { w, b };
  }, [summaries]);

  const renderItem = ({ item }) => {
    const when = item.endedAt?.toDate?.() ? item.endedAt.toDate().toLocaleString() : "";
    const catName = item.categoryId ? categoryNameById[item.categoryId] : "Kategori yok";

    return (
      <View style={styles.sessionRow}>
        <View style={styles.rowTop}>
          <Text style={styles.sessionText}>Seans #{item.sessionNo ?? "-"}</Text>
          <Text style={styles.endedBy}>
            {item.endedBy === "stopped" ? "⏹ sonlandır" : item.endedBy === "completed" ? "✅ tamamlandı" : ""}
          </Text>
        </View>

        <Text style={styles.sessionSub}>Kategori: {catName}</Text>
        <Text style={styles.sessionSub}>🎯 Çalışma: {toMin(item.workSeconds)} dk</Text>
        <Text style={styles.sessionSub}>☕ Mola: {toMin(item.breakSeconds)} dk</Text>
        <Text style={styles.sessionDate}>{when}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Toplam Çalışma</Text>
          <Text style={styles.bigText}>{toMin(totals.w)} dk</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Toplam Mola</Text>
          <Text style={styles.bigText}>{toMin(totals.b)} dk</Text>
        </View>
      </View>

      <FlatList
        data={summaries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        ListEmptyComponent={<Text style={{ marginTop: 20 }}>Henüz seans özeti yok</Text>}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16 },

  cardsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: "#f2f2f2", padding: 14, borderRadius: 12 },
  cardTitle: { fontSize: 13, fontWeight: "800", marginBottom: 6 },
  bigText: { fontSize: 24, fontWeight: "900" },

  sessionRow: { backgroundColor: "#f8f8f8", padding: 12, borderRadius: 12 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionText: { fontSize: 16, fontWeight: "800" },
  endedBy: { fontSize: 12, fontWeight: "900", color: "#444" },
  sessionSub: { fontSize: 12, color: "#555", marginTop: 4, fontWeight: "700" },
  sessionDate: { fontSize: 12, color: "#777", marginTop: 6 },
});
