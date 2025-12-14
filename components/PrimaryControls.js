import { View, Text, Pressable, TouchableOpacity, StyleSheet } from "react-native";

export default function PrimaryControls({
  isRunning,
  onToggle,
  onReset,
  onSkip,
  onStop,
  mode,
}) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity activeOpacity={0.85} style={styles.primaryButton} onPress={onToggle}>
        <Text style={styles.primaryButtonText}>{isRunning ? "Pause" : "Start"}</Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <Pressable onPress={onReset} style={styles.smallBtn}>
          <Text style={styles.smallBtnText}>⟲ Reset</Text>
        </Pressable>

        <Pressable onPress={onSkip} style={styles.smallBtn}>
          <Text style={styles.smallBtnText}>⏭ {mode === "work" ? "Mola" : "Work"}</Text>
        </Pressable>

        <Pressable onPress={onStop} style={styles.smallBtn}>
          <Text style={styles.smallBtnText}>⏹ Sonlandır</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 12, marginTop: 6 },
  primaryButton: {
    backgroundColor: "#000000ff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: { color: "#ffffffff", fontSize: 18, fontWeight: "900" },
  actionsRow: { width: "100%", flexDirection: "row", gap: 10 },
  smallBtn: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  smallBtnText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
