import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function CategorySelector({
  categories,
  selectedCategoryId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}) {
  const [open, setOpen] = useState(false);

  const selectedName = useMemo(() => {
    const found = categories.find((c) => c.id === selectedCategoryId);
    return found?.name ?? "Kategori seç";
  }, [categories, selectedCategoryId]);

  const openActions = (cat) => {
    Alert.alert(
      "Kategori",
      `"${cat.name}"`,
      [
        {
          text: "Yeniden Adlandır",
          onPress: () => renameFlow(cat),
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => deleteFlow(cat),
        },
        { text: "Vazgeç", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const renameFlow = (cat) => {
    // Android'de prompt yok o yüzden kendi modal açıyorum.
    setRenameState({ visible: true, id: cat.id, name: cat.name });
  };

  const deleteFlow = (cat) => {
    Alert.alert(
      "Silinsin mi?",
      `"${cat.name}" silinecek. Devam?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await onDelete(cat.id);
            } catch (e) {
              console.log(e);
              Alert.alert("Hata", "Silme başarısız.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const [addState, setAddState] = useState({ visible: false, name: "" });
  const [renameState, setRenameState] = useState({ visible: false, id: null, name: "" });

  const addCategory = async () => {
    const name = addState.name.trim();
    if (!name) return Alert.alert("Boş olmaz", "Kategori adı yazmalısın.");
    try {
      await onAdd(name);
      setAddState({ visible: false, name: "" });
    } catch (e) {
      console.log(e);
      Alert.alert("Hata", "Kategori eklenemedi.");
    }
  };

  const renameCategory = async () => {
    const name = renameState.name.trim();
    if (!name) return Alert.alert("Boş olmaz", "Kategori adı yazmalısın.");
    try {
      await onRename(renameState.id, name);
      setRenameState({ visible: false, id: null, name: "" });
    } catch (e) {
      console.log(e);
      Alert.alert("Hata", "Kategori güncellenemedi.");
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Kategori</Text>
      <Pressable style={styles.selectBtn} onPress={() => setOpen(true)}>
        <Text style={styles.selectText}>{selectedName}</Text>
        <Text style={styles.chev}>▾</Text>
      </Pressable>

      {/* Liste Modal */}
      <Modal visible={open} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Kategori Seç</Text>
              <Pressable
                onPress={() => setAddState({ visible: true, name: "" })}
                style={styles.smallAction}
              >
                <Text style={styles.smallActionText}>＋ Ekle</Text>
              </Pressable>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.empty}>Henüz kategori yok. “Ekle” ile oluştur.</Text>
              }
              renderItem={({ item }) => {
                const active = item.id === selectedCategoryId;
                return (
                  <Pressable
                    style={[styles.row, active && styles.rowActive]}
                    onPress={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                    onLongPress={() => openActions(item)}
                    delayLongPress={300}
                  >
                    <Text style={[styles.rowText, active && styles.rowTextActive]}>
                      {item.name}
                    </Text>
                    <Pressable onPress={() => openActions(item)} hitSlop={10}>
                      <Text style={styles.more}>⋯</Text>
                    </Pressable>
                  </Pressable>
                );
              }}
            />

            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ADD MODAL */}
      <Modal visible={addState.visible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Kategori Ekle</Text>
            <TextInput
              value={addState.name}
              onChangeText={(t) => setAddState((s) => ({ ...s, name: t }))}
              style={styles.input}
              placeholder="Örn: Kitap okuma"
              autoFocus
            />
            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => setAddState({ visible: false, name: "" })}
              >
                <Text style={styles.btnGhostText}>İptal</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={addCategory}>
                <Text style={styles.btnText}>Ekle</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* RENAME MODAL */}
      <Modal visible={renameState.visible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Yeniden Adlandır</Text>
            <TextInput
              value={renameState.name}
              onChangeText={(t) => setRenameState((s) => ({ ...s, name: t }))}
              style={styles.input}
              placeholder="Yeni ad"
              autoFocus
            />
            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => setRenameState({ visible: false, id: null, name: "" })}
              >
                <Text style={styles.btnGhostText}>İptal</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={renameCategory}>
                <Text style={styles.btnText}>Kaydet</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 6 },

  label: { fontSize: 14, fontWeight: "900", color: "#000" },

  selectBtn: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  chev: { color: "#fff", fontWeight: "900", fontSize: 16 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    maxHeight: "80%",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "900" },

  smallAction: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  smallActionText: { fontWeight: "900" },

  row: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowActive: { backgroundColor: "rgba(0,0,0,0.08)" },
  rowText: { fontSize: 15, fontWeight: "800", color: "#111" },
  rowTextActive: { color: "#000" },
  more: { fontSize: 22, fontWeight: "900", color: "#444", paddingHorizontal: 6 },

  empty: { color: "#666", fontWeight: "700", paddingVertical: 10 },

  closeBtn: {
    marginTop: 10,
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontWeight: "900" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
    marginTop: 10,
  },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  btn: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "900" },
  btnGhost: { backgroundColor: "#eee" },
  btnGhostText: { color: "#000", fontWeight: "900" },
});
