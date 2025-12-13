import { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions, Alert } from "react-native";
import CircularProgress from "../components/CircularProgress";

import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

import TimerHeader from "../components/TimerHeader";
import PrimaryControls from "../components/PrimaryControls";
import SettingsModal from "../components/SettingsModal";
import CategorySelector from "../components/CategorySelector"; 

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [mode, setMode] = useState("work"); 
  const [isRunning, setIsRunning] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Firestore: kategoriler
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCategories(list);
        if (!selectedCategoryId && list.length > 0) setSelectedCategoryId(list[0].id);
      },
      (err) => console.log("categories onSnapshot error:", err)
    );
    return () => unsub();
  
  }, []);

  const currentTotalSeconds = useMemo(() => {
    return (mode === "work" ? workMinutes : breakMinutes) * 60;
  }, [mode, workMinutes, breakMinutes]);

  const [time, setTime] = useState(currentTotalSeconds);

  // Mod/süre değişince reset + pause
  useEffect(() => {
    setTime(currentTotalSeconds);
    setIsRunning(false);
  }, [currentTotalSeconds]);

  // Timer tick
  useEffect(() => {
    let timer;
    if (isRunning && time > 0) {
      timer = setInterval(() => setTime((prev) => prev - 1), 1000);
    }

    if (isRunning && time === 0) {
      setIsRunning(false);

      if (mode === "work") {
        saveSessionSafe(workMinutes * 60, selectedCategoryId);
        Alert.alert("Bitti!", "Çalışma tamamlandı. Mola zamanı ☕");
        setMode("break");
      } else {
        Alert.alert("Bitti!", "Mola bitti. Tekrar odak zamanı 🔥");
        setMode("work");
      }
    }

    return () => clearInterval(timer);
  }, [isRunning, time, mode, workMinutes, selectedCategoryId]);

  const progress = useMemo(() => {
    if (currentTotalSeconds <= 0) return 0;
    return (currentTotalSeconds - time) / currentTotalSeconds;
  }, [currentTotalSeconds, time]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetCurrent = () => {
    setIsRunning(false);
    setTime(currentTotalSeconds);
  };

  const skip = () => {
    setIsRunning(false);
    setMode((m) => (m === "work" ? "break" : "work"));
  };

  const saveSessionSafe = async (durationSeconds, categoryId) => {
    try {
      await addDoc(collection(db, "sessions"), {
        categoryId: categoryId ?? null,
        durationSeconds,
        finishedAt: serverTimestamp(),
      });
    } catch (e) {
      console.log("saveSession error:", e);
    }
  };

  const selectedCategoryName = useMemo(() => {
    const found = categories.find((c) => c.id === selectedCategoryId);
    return found?.name ?? "Kategori seç";
  }, [categories, selectedCategoryId]);

  // Responsive progress size
  const progressSize = Math.min(Math.floor(width * 0.62), 220);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TimerHeader mode={mode} onOpenSettings={() => setSettingsOpen(true)} />

        {/* ✅ CircularProgress'in tam üstünde: Liste gibi kategori seçici */}
        <CategorySelector
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          onAdd={async (name) => {
            const docRef = await addDoc(collection(db, "categories"), {
              name,
              createdAt: serverTimestamp(),
            });
            setSelectedCategoryId(docRef.id);
          }}
          onRename={async (id, newName) => {
            await updateDoc(doc(db, "categories", id), { name: newName });
          }}
          onDelete={async (id) => {
            await deleteDoc(doc(db, "categories", id));
            if (selectedCategoryId === id) {
              const remaining = categories.filter((c) => c.id !== id);
              setSelectedCategoryId(remaining[0]?.id ?? null);
            }
          }}
        />

        <View style={styles.progressWrap}>
          <CircularProgress
            size={progressSize}
            strokeWidth={14}
            progress={progress}
            color="#ffffffff"
          />
        </View>

        <View style={styles.timeWrap}>
          <TimerHeader.TimeText value={formatTime(time)} />
          <TimerHeader.SubInfo
            text={selectedCategoryId ? `🎯 ${selectedCategoryName}` : "🎯 Kategori seçilmedi"}
          />
        </View>

        <PrimaryControls
          isRunning={isRunning}
          onToggle={() => setIsRunning((v) => !v)}
          onReset={resetCurrent}
          onSkip={skip}
          mode={mode}
        />

        <SettingsModal
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          workMinutes={workMinutes}
          breakMinutes={breakMinutes}
          onSave={(w, b) => {
            setWorkMinutes(w);
            setBreakMinutes(b);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f85454ff",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  progressWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 6,
  },
  timeWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
});
