import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions } from "react-native";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "../src/auth/AuthProvider";
import { BarChart, PieChart } from "react-native-chart-kit";

export default function DashboardScreen() {
  const { user } = useAuth();
  if (!user) return null;

  const uid = user.uid;

  const summariesRef = collection(db, "users", uid, "session_summaries");
  const categoriesRef = collection(db, "users", uid, "categories");
  const distractionsRef = collection(db, "users", uid, "distractions");

  const [summaries, setSummaries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [distractions, setDistractions] = useState([]);
  const [activeTab, setActiveTab] = useState("sessions"); // "sessions" | "distractions"

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

  useEffect(() => {
    const q = query(distractionsRef, orderBy("happenedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDistractions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [uid]);

  const categoryNameById = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.id] = c.name;
    return map;
  }, [categories]);

  const toMin = (sec) => Math.floor((sec || 0) / 60);

  // ✅ Toplamlar (tüm zamanlar)
  const totals = useMemo(() => {
    let w = 0, b = 0;
    for (const s of summaries) {
      w += s.workSeconds || 0;
      b += s.breakSeconds || 0;
    }
    return { w, b };
  }, [summaries]);

  // ✅ BUGÜN toplam odak (bugünkü çalışma + mola)
  const todayTotals = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let w = 0, b = 0;

    for (const s of summaries) {
      const ended = s.endedAt?.toDate?.() ? s.endedAt.toDate() : null;
      if (!ended) continue;
      if (ended < start || ended > end) continue;

      w += s.workSeconds || 0;
      b += s.breakSeconds || 0;
    }

    return { w, b, focus: w + b };
  }, [summaries]);

  // ✅ Dikkat özeti
  const distractionSummary = useMemo(() => {
    const total = distractions.length;

    const bySession = {};
    for (const d of distractions) {
      const key = d.sessionNo ?? "unknown";
      bySession[key] = (bySession[key] || 0) + 1;
    }
    const sessionCount = Object.keys(bySession).length;
    const avgPerSession = sessionCount > 0 ? (total / sessionCount).toFixed(1) : "0";

    // ✅ Bugünkü dikkat sayısı
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let today = 0;
    for (const d of distractions) {
      const t = d.happenedAt?.toDate?.() ? d.happenedAt.toDate() : null;
      if (!t) continue;
      if (t >= start && t <= end) today += 1;
    }

    return { total, today, avgPerSession };
  }, [distractions]);

  // ===== Bar: son 7 gün çalışma (dk)
  const last7BarData = useMemo(() => {
    const now = new Date();
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }

    const workByDay = new Map();
    for (const d of days) workByDay.set(d.toISOString().slice(0, 10), 0);

    for (const s of summaries) {
      const ended = s.endedAt?.toDate?.() ? s.endedAt.toDate() : null;
      if (!ended) continue;

      const dayKey = new Date(ended);
      dayKey.setHours(0, 0, 0, 0);
      const key = dayKey.toISOString().slice(0, 10);

      if (workByDay.has(key)) {
        workByDay.set(key, (workByDay.get(key) || 0) + (s.workSeconds || 0));
      }
    }

    const labels = days.map((d) => {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}`;
    });

    const values = days.map((d) => {
      const key = d.toISOString().slice(0, 10);
      return toMin(workByDay.get(key) || 0);
    });

    return { labels, values };
  }, [summaries]);

  // ===== Pie: kategori dağılımı (çalışma)
  const pieData = useMemo(() => {
    const map = {};
    for (const s of summaries) {
      const cat = s.categoryId || "none";
      map[cat] = (map[cat] || 0) + (s.workSeconds || 0);
    }

    const entries = Object.entries(map).filter(([, sec]) => (sec || 0) > 0);
    if (entries.length === 0) return [];

    const randColor = () => {
      const r = 120 + Math.floor(Math.random() * 100);
      const g = 120 + Math.floor(Math.random() * 100);
      const b = 120 + Math.floor(Math.random() * 100);
      return `rgb(${r},${g},${b})`;
    };

    return entries
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .slice(0, 6)
      .map(([catId, sec]) => {
        const name =
          catId === "none" ? "Kategori yok" : categoryNameById[catId] || "Silinmiş kategori";

        return {
          name,
          minutes: toMin(sec),
          color: randColor(),
          legendFontColor: "#333",
          legendFontSize: 12,
        };
      });
  }, [summaries, categoryNameById]);

  const pieTotalMinutes = useMemo(
    () => pieData.reduce((acc, x) => acc + (x.minutes || 0), 0),
    [pieData]
  );

  const screenW = Dimensions.get("window").width;
  const chartW = Math.min(screenW - 32, 420);

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: "#ffffff",
      backgroundGradientTo: "#ffffff",
      decimalPlaces: 0,
      color: () => "rgba(0,0,0,1)",
      labelColor: () => "rgba(0,0,0,0.8)",
      propsForBackgroundLines: { stroke: "#eee" },
      propsForLabels: { fontWeight: "700" },
    }),
    []
  );

  const listData = activeTab === "sessions" ? summaries : distractions;

  const renderItem = ({ item }) => {
    if (activeTab === "sessions") {
      const when = item.endedAt?.toDate?.() ? item.endedAt.toDate().toLocaleString() : "";
      const catName = item.categoryId ? categoryNameById[item.categoryId] : "Kategori yok";

      return (
        <View style={styles.rowCard}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle}>Seans #{item.sessionNo ?? "-"}</Text>
            <Text style={styles.badge}>
              {item.endedBy === "stopped"
                ? "⏹ sonlandır"
                : item.endedBy === "completed"
                ? "✅ tamamlandı"
                : ""}
            </Text>
          </View>
          <Text style={styles.rowSub}>Kategori: {catName}</Text>
          <Text style={styles.rowSub}>🎯 Çalışma: {toMin(item.workSeconds)} dk</Text>
          <Text style={styles.rowSub}>☕ Mola: {toMin(item.breakSeconds)} dk</Text>
          <Text style={styles.rowDate}>{when}</Text>
        </View>
      );
    } else {
      const when = item.happenedAt?.toDate?.() ? item.happenedAt.toDate().toLocaleString() : "";
      const icon = item.mode === "work" ? "🎯" : "☕";
      return (
        <View style={styles.rowCard}>
          <Text style={styles.rowTitle}>⚠️ Seans #{item.sessionNo ?? "-"} {icon}</Text>
          <Text style={styles.rowSub}>
            Fazda geçen: {toMin(item.secondsIntoPhase)} dk • Sebep: {item.reason ?? "-"}
          </Text>
          <Text style={styles.rowDate}>{when}</Text>
        </View>
      );
    }
  };

  const Header = () => (
    <View>
      <Text style={styles.title}>Dashboard</Text>

      {/* ✅ BUGÜN TOPLAM ODAK */}
      <View style={styles.cardWide}>
        <Text style={styles.cardTitle}>Bugün Toplam Odak</Text>
        <Text style={styles.bigText}>{toMin(todayTotals.focus)} dk</Text>
        <Text style={styles.rowSub}>
          🎯 {toMin(todayTotals.w)} dk • ☕ {toMin(todayTotals.b)} dk • ⚠️ {distractionSummary.today}
        </Text>
      </View>

      {/* TOPLAM (TÜM ZAMANLAR) */}
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

      {/* DİKKAT (TÜM ZAMANLAR) */}
      <View style={styles.cardWide}>
        <Text style={styles.cardTitle}>Dikkat Dağınıklığı</Text>
        <Text style={styles.bigText}>⚠️ {distractionSummary.total}</Text>
        <Text style={styles.rowSub}>Seans başına ortalama: {distractionSummary.avgPerSession}</Text>
      </View>

      {/* BAR */}
      <View style={styles.cardWide}>
        <Text style={styles.sectionTitle}>Son 7 Gün Odak Süresi (dk)</Text>
        <BarChart
          data={{ labels: last7BarData.labels, datasets: [{ data: last7BarData.values }] }}
          width={chartW}
          height={220}
          chartConfig={chartConfig}
          fromZero
          showValuesOnTopOfBars
          style={{ borderRadius: 12 }}
        />
      </View>

      {/* PIE */}
      <View style={styles.cardWide}>
        <Text style={styles.sectionTitle}>Kategori Dağılımı (Çalışma)</Text>
        {pieData.length === 0 || pieTotalMinutes === 0 ? (
          <Text style={{ marginTop: 8, fontWeight: "700", color: "#666" }}>
            Henüz kategori bazlı çalışma verisi yok.
          </Text>
        ) : (
          <PieChart
            data={pieData.map((p) => ({
              name: `${p.name} (${p.minutes} dk)`,
              population: p.minutes,
              color: p.color,
              legendFontColor: p.legendFontColor,
              legendFontSize: p.legendFontSize,
            }))}
            width={chartW}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
            style={{ borderRadius: 12 }}
          />
        )}
      </View>

      {/* SEKME */}
      <View style={styles.tabsRow}>
        <Pressable
          onPress={() => setActiveTab("sessions")}
          style={[styles.tabBtn, activeTab === "sessions" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "sessions" && styles.tabTextActive]}>
            Seanslar ({summaries.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("distractions")}
          style={[styles.tabBtn, activeTab === "distractions" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "distractions" && styles.tabTextActive]}>
            Dikkat ({distractions.length})
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        {activeTab === "sessions" ? "Seans Özetleri" : "Dikkat Dağınıklıkları"}
      </Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={listData}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={Header}
      contentContainerStyle={{ paddingBottom: 40, gap: 10 }}
      ListEmptyComponent={
        <Text style={{ marginTop: 10, fontWeight: "700", color: "#666" }}>
          {activeTab === "sessions" ? "Henüz seans özeti yok" : "Henüz dikkat dağınıklığı yok 🎉"}
        </Text>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16 },

  sectionTitle: { fontSize: 15, fontWeight: "900", marginBottom: 10 },

  cardsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: "#f2f2f2", padding: 14, borderRadius: 12 },
  cardWide: { backgroundColor: "#f2f2f2", padding: 14, borderRadius: 12, marginBottom: 12 },

  cardTitle: { fontSize: 13, fontWeight: "800", marginBottom: 6 },
  bigText: { fontSize: 24, fontWeight: "900" },

  rowCard: { backgroundColor: "#f8f8f8", padding: 12, borderRadius: 12 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowTitle: { fontSize: 16, fontWeight: "800" },
  badge: { fontSize: 12, fontWeight: "900", color: "#444" },

  rowSub: { fontSize: 12, color: "#555", marginTop: 4, fontWeight: "700" },
  rowDate: { fontSize: 12, color: "#777", marginTop: 6 },

  tabsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#111" },
  tabText: { fontWeight: "900" },
  tabTextActive: { color: "#fff" },
});
