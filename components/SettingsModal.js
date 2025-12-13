import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function SettingsModal({
  visible,
  onClose,
  workMinutes,
  breakMinutes,
  onSave,
}) {
  const [draftWork, setDraftWork] = useState(String(workMinutes));
  const [draftBreak, setDraftBreak] = useState(String(breakMinutes));

  useEffect(() => {
    if (visible) {
      setDraftWork(String(workMinutes));
      setDraftBreak(String(breakMinutes));
    }
  }, [visible, workMinutes, breakMinutes]);

  const handleSave = () => {
    const w = parseInt(draftWork, 10);
    const b = parseInt(draftBreak, 10);

    if (!Number.isFinite(w) || !Number.isFinite(b) || w <= 0 || b <= 0) {
      Alert.alert("Hatalı değer", "Dakikalar 1 veya daha büyük olmalı.");
      return;
    }
    if (w > 240 || b > 120) {
      Alert.alert("Çok büyük değer", "Çalışma ≤ 240dk, mola ≤ 120dk önerilir.");
      return;
    }

    onSave(w, b);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Süre Ayarları</Text>

          <Text style={styles.inputLabel}>Çalışma (dk)</Text>
          <TextInput
            value={draftWork}
            onChangeText={setDraftWork}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="Örn: 25"
          />

          <Text style={styles.inputLabel}>Mola (dk)</Text>
          <TextInput
            value={draftBreak}
            onChangeText={setDraftBreak}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="Örn: 5"
          />

          <View style={styles.modalRow}>
            <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={onClose}>
              <Text style={styles.modalBtnTextGhost}>İptal</Text>
            </Pressable>

            <Pressable style={styles.modalBtn} onPress={handleSave}>
              <Text style={styles.modalBtnText}>Kaydet</Text>
            </Pressable>
          </View>

          <Text style={styles.modalHint}>Kaydedince timer resetlenir.</Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  modalRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnText: {
    color: "white",
    fontWeight: "900",
  },
  modalBtnGhost: {
    backgroundColor: "#eee",
  },
  modalBtnTextGhost: {
    color: "#000",
    fontWeight: "900",
  },
  modalHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
  },
});
