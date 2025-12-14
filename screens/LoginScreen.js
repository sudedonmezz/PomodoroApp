import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (e) {
      Alert.alert("Giriş başarısız", e.message);
    }
  };

  return (
    <View style={styles.c}>
      <Text style={styles.t}>Giriş</Text>
      <TextInput style={styles.i} placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail}/>
      <TextInput style={styles.i} placeholder="Şifre" secureTextEntry value={pass} onChangeText={setPass}/>
      <Pressable style={styles.b} onPress={login}><Text style={styles.bt}>Giriş Yap</Text></Pressable>
      <Pressable onPress={() => navigation.navigate("Register")}>
        <Text style={styles.l}>Hesabın yok mu? Kayıt ol</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  c:{flex:1,padding:16,justifyContent:"center",gap:10},
  t:{fontSize:26,fontWeight:"900"},
  i:{borderWidth:1,borderColor:"#ddd",borderRadius:10,padding:12},
  b:{backgroundColor:"#000",padding:14,borderRadius:10,alignItems:"center"},
  bt:{color:"#fff",fontWeight:"900"},
  l:{marginTop:10,fontWeight:"800"}
});
