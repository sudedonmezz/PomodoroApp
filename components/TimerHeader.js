import { View, Text, Pressable, StyleSheet } from "react-native";

export default function TimerHeader({ mode, onOpenSettings }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.modeText}>{mode === "work" ? "Çalışma" : "Mola"}</Text>

      <Pressable onPress={onOpenSettings} hitSlop={10} style={styles.iconBtn}>
        <Text style={styles.iconText}>⚙️</Text>
      </Pressable>
    </View>
  );
}

function TimeText({ value }) {
  return <Text style={styles.timerText}>{value}</Text>;
}

function SubInfo({ text }) {
  return <Text style={styles.subInfo}>{text}</Text>;
}

TimerHeader.TimeText = TimeText;
TimerHeader.SubInfo = SubInfo;

const styles = StyleSheet.create({
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000",
  },
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  iconText: {
    fontSize: 18,
  },
  timerText: {
    fontSize: 44,
    fontWeight: "900",
    color: "#000",
  },
  subInfo: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(0,0,0,0.75)",
  },
});
