import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Alert,
  AppState,
} from "react-native";
import CircularProgress from "../components/CircularProgress";

import { useAuth } from "../src/auth/AuthProvider";
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
  runTransaction,
} from "firebase/firestore";

import TimerHeader from "../components/TimerHeader";
import PrimaryControls from "../components/PrimaryControls";
import SettingsModal from "../components/SettingsModal";
import CategorySelector from "../components/CategorySelector";

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  if (!user) return null;

  const uid = user.uid;

  // ✅ kullanıcıya özel collection ref’leri
  const categoriesRef = collection(db, "users", uid, "categories");
  const summariesRef = collection(db, "users", uid, "session_summaries");
  const distractionsRef = collection(db, "users", uid, "distractions");

  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [mode, setMode] = useState("work");
  const [isRunning, setIsRunning] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [workAccum, setWorkAccum] = useState(0);
  const [breakAccum, setBreakAccum] = useState(0);
  const workAccumRef = useRef(0);
  const breakAccumRef = useRef(0);

  const [sessionNo, setSessionNo] = useState(null);
  const startedAtRef = useRef(null);

  const phaseTotalRef = useRef(0);

  // ✅ AppState
  const appStateRef = useRef(AppState.currentState);
  const [distractionCount, setDistractionCount] = useState(0);

  const getTotalSeconds = (m) => (m === "work" ? workMinutes : breakMinutes) * 60;

  const currentTotalSeconds = useMemo(
    () => getTotalSeconds(mode),
    [mode, workMinutes, breakMinutes]
  );

  const [time, setTime] = useState(currentTotalSeconds);

  // ✅ KATEGORİLER: users/{uid}/categories dinle
  useEffect(() => {
    const q = query(categoriesRef, orderBy("createdAt", "asc"));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // mode/süre değişince fazı resetle
  useEffect(() => {
    setTime(currentTotalSeconds);
    setIsRunning(false);
    phaseTotalRef.current = currentTotalSeconds;
  }, [currentTotalSeconds]);

  // ✅ counter -> sessionNo (kullanıcıya özel sayaç)
  const getNextSessionNo = async () => {
    const counterRef = doc(db, "users", uid, "counters", "session_summaries");
    const nextNo = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists() ? (snap.data().value ?? 0) : 0;
      const updated = current + 1;
      tx.set(counterRef, { value: updated }, { merge: true });
      return updated;
    });
    return nextNo;
  };

  const ensureSessionStarted = async () => {
    if (sessionNo != null) return sessionNo;
    const no = await getNextSessionNo();
    setSessionNo(no);
    startedAtRef.current = new Date();

    workAccumRef.current = 0;
    breakAccumRef.current = 0;
    setWorkAccum(0);
    setBreakAccum(0);

    setDistractionCount(0);

    return no;
  };

  const saveSessionSummaryToDB = async ({
    endedBy,
    finalWorkSec,
    finalBreakSec,
    finalSessionNo,
  }) => {
    if ((finalWorkSec + finalBreakSec) <= 0 || finalSessionNo == null) return;

    await addDoc(summariesRef, {
      sessionNo: finalSessionNo,
      categoryId: selectedCategoryId ?? null,
      workSeconds: finalWorkSec,
      breakSeconds: finalBreakSec,
      plannedWorkMinutes: workMinutes,
      plannedBreakMinutes: breakMinutes,
      startedAt: startedAtRef.current ?? null,
      endedAt: serverTimestamp(),
      endedBy,
    });
  };

  // ✅ distraction kaydı
  const logDistraction = async () => {
    try {
      const phaseTotal = phaseTotalRef.current;
      const elapsed = Math.max(0, phaseTotal - time);

      await addDoc(distractionsRef, {
        sessionNo: sessionNo ?? null,
        mode,
        secondsIntoPhase: elapsed,
        happenedAt: serverTimestamp(),
        reason: "app_background",
      });

      setDistractionCount((c) => c + 1);
    } catch (e) {
      console.log("logDistraction error:", e);
    }
  };

  // ✅ arka plana gidince otomatik pause + distraction
  const pauseBecauseDistraction = async () => {
    if (!isRunning) return;

    setIsRunning(false);
    await ensureSessionStarted();

    const phaseTotal = phaseTotalRef.current;
    const elapsed = Math.max(0, phaseTotal - time);

    if (elapsed > 0) {
      if (mode === "work") {
        workAccumRef.current += elapsed;
        setWorkAccum(workAccumRef.current);
      } else {
        breakAccumRef.current += elapsed;
        setBreakAccum(breakAccumRef.current);
      }
    }

    await logDistraction();
  };

  // ✅ AppState listener
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (isRunning && (nextState === "background" || nextState === "inactive")) {
        await pauseBecauseDistraction();
        return;
      }

      if (prev !== "active" && nextState === "active") {
        if (!isRunning && sessionNo != null) {
          setTimeout(() => {
            Alert.alert(
              "Geri geldin 👀",
              "Sayaç duraklatıldı. Devam etmek ister misin?",
              [
                { text: "Hayır", style: "cancel" },
                { text: "Devam", onPress: () => setIsRunning(true) },
              ]
            );
          }, 50);
        }
      }
    });

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, sessionNo, mode, time]);

  const toggleRun = async () => {
    if (!isRunning) {
      await ensureSessionStarted();
      phaseTotalRef.current = getTotalSeconds(mode);
    }
    setIsRunning((v) => !v);
  };

  const skip = async () => {
    setIsRunning(false);
    await ensureSessionStarted();

    const phaseTotal = phaseTotalRef.current;
    const elapsed = Math.max(0, phaseTotal - time);

    if (elapsed > 0) {
      if (mode === "work") {
        workAccumRef.current += elapsed;
        setWorkAccum(workAccumRef.current);
      } else {
        breakAccumRef.current += elapsed;
        setBreakAccum(breakAccumRef.current);
      }
    }

    const nextMode = mode === "work" ? "break" : "work";
    setMode(nextMode);

    const nextTotal = getTotalSeconds(nextMode);
    setTime(nextTotal);
    phaseTotalRef.current = nextTotal;
  };

  const stopSession = async () => {
    setIsRunning(false);

    if (sessionNo == null && (workAccumRef.current + breakAccumRef.current) === 0) {
      setMode("work");
      const w = getTotalSeconds("work");
      setTime(w);
      phaseTotalRef.current = w;
      return;
    }

    const phaseTotal = phaseTotalRef.current;
    const elapsed = Math.max(0, phaseTotal - time);

    let finalWorkSec = workAccumRef.current;
    let finalBreakSec = breakAccumRef.current;

    if (elapsed > 0) {
      if (mode === "work") finalWorkSec += elapsed;
      else finalBreakSec += elapsed;
    }

    const finalSessionNo = sessionNo;

    workAccumRef.current = finalWorkSec;
    breakAccumRef.current = finalBreakSec;
    setWorkAccum(finalWorkSec);
    setBreakAccum(finalBreakSec);

    await saveSessionSummaryToDB({
      endedBy: "stopped",
      finalWorkSec,
      finalBreakSec,
      finalSessionNo,
    });

    const totalWorkMin = Math.floor(finalWorkSec / 60);
    const totalBreakMin = Math.floor(finalBreakSec / 60);

    setTimeout(() => {
      Alert.alert(
        "Seans Özeti",
        `Çalışma: ${totalWorkMin} dk\nMola: ${totalBreakMin} dk\nDikkat dağınıklığı: ${distractionCount}\nSeans ID: ${finalSessionNo ?? "-"}`,
        [{ text: "Tamam" }]
      );
    }, 50);

    // reset
    setSessionNo(null);
    startedAtRef.current = null;

    workAccumRef.current = 0;
    breakAccumRef.current = 0;
    setWorkAccum(0);
    setBreakAccum(0);

    setDistractionCount(0);

    setMode("work");
    const w = getTotalSeconds("work");
    setTime(w);
    phaseTotalRef.current = w;
  };

  // Timer tick
  useEffect(() => {
    let timer;

    if (isRunning && time > 0) {
      timer = setInterval(() => setTime((prev) => prev - 1), 1000);
    }

    if (isRunning && time === 0) {
      setIsRunning(false);

      (async () => {
        await ensureSessionStarted();

        const phaseTotal = phaseTotalRef.current;
        if (phaseTotal > 0) {
          if (mode === "work") {
            workAccumRef.current += phaseTotal;
            setWorkAccum(workAccumRef.current);
          } else {
            breakAccumRef.current += phaseTotal;
            setBreakAccum(breakAccumRef.current);
          }
        }

        if (mode === "work") {
          Alert.alert("Bitti!", "Çalışma tamamlandı. Mola zamanı ☕");
          const nextMode = "break";
          setMode(nextMode);
          const nextTotal = getTotalSeconds(nextMode);
          setTime(nextTotal);
          phaseTotalRef.current = nextTotal;
        } else {
          Alert.alert("Bitti!", "Mola bitti. Tekrar odak zamanı 🔥");
          const nextMode = "work";
          setMode(nextMode);
          const nextTotal = getTotalSeconds(nextMode);
          setTime(nextTotal);
          phaseTotalRef.current = nextTotal;
        }
      })();
    }

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, time, mode]);

  const progress = useMemo(() => {
    const total = phaseTotalRef.current || currentTotalSeconds;
    if (total <= 0) return 0;
    return (total - time) / total;
  }, [time, currentTotalSeconds]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetCurrent = () => {
    setIsRunning(false);
    const t = getTotalSeconds(mode);
    setTime(t);
    phaseTotalRef.current = t;
  };

  const selectedCategoryName = useMemo(() => {
    const found = categories.find((c) => c.id === selectedCategoryId);
    return found?.name ?? "Kategori seç";
  }, [categories, selectedCategoryId]);

  const progressSize = Math.min(Math.floor(width * 0.62), 220);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TimerHeader mode={mode} onOpenSettings={() => setSettingsOpen(true)} />

        <CategorySelector
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          onAdd={async (name) => {
            const docRef = await addDoc(categoriesRef, {
              name,
              createdAt: serverTimestamp(),
            });
            setSelectedCategoryId(docRef.id);
          }}
          onRename={async (id, newName) => {
            await updateDoc(doc(db, "users", uid, "categories", id), { name: newName });
          }}
          onDelete={async (id) => {
            await deleteDoc(doc(db, "users", uid, "categories", id));
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
            text={
              mode === "work"
                ? (selectedCategoryId ? `🎯 ${selectedCategoryName}` : "🎯 Kategori seçilmedi")
                : "☕ Mola"
            }
          />
          <TimerHeader.SubInfo text={`⚠️ Dikkat dağınıklığı: ${distractionCount}`} />
        </View>

        <PrimaryControls
          isRunning={isRunning}
          onToggle={toggleRun}
          onReset={resetCurrent}
          onSkip={skip}
          onStop={stopSession}
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
  screen: { flex: 1, backgroundColor: "#f85454ff" },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  progressWrap: { width: "100%", alignItems: "center", marginTop: 6 },
  timeWrap: { width: "100%", alignItems: "center", marginTop: 4, gap: 6 },
});
