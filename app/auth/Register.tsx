import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { useRouter  } from "expo-router";



// 🎨 Theme
const theme = {
  bg: "#0f172a",
  card: "#1e293b",
  primary: "#22c55e",
  text: "#ffffff",
  subtext: "#94a3b8",
};

const API_URL = "https://niktech-backend.onrender.com";

export default function RegisterScreen({ navigation }: any) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    role: "employee",
    fingerprint_id: "",
  });

  const Register = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.detail || "Registration failed");
      } else {
        Alert.alert("Success", "Account created");
        router.push("/auth/Login");
      }
    } catch (err) {
      Alert.alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <Text style={styles.title}>Create Account</Text>

        <View style={styles.card}>
          <TextInput
            placeholder="Full Name *"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />

          <TextInput
            placeholder="Email *"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="email-address"
            onChangeText={(t) => setForm({ ...form, email: t })}
          />

          <TextInput
            placeholder="Password *"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            secureTextEntry
            onChangeText={(t) => setForm({ ...form, password: t })}
          />

          <TextInput
            placeholder="Phone"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="phone-pad"
            onChangeText={(t) => setForm({ ...form, phone: t })}
          />

          <TextInput
            placeholder="Department"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            onChangeText={(t) => setForm({ ...form, department: t })}
          />

          <Text style={styles.label}>Select Role</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={form.role}
              onValueChange={(value) =>
                setForm({ ...form, role: value })
              }
              dropdownIconColor="#fff"
            >
              <Picker.Item label="Employee" value="employee" />
              <Picker.Item label="Manager" value="manager" />
              <Picker.Item label="Admin" value="admin" />
              <Picker.Item label="user" value="user" />
            </Picker>
          </View>

          <TextInput
            placeholder="Fingerprint ID"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(t) =>
              setForm({ ...form, fingerprint_id: t })
            }
          />

          {/* Register Button */}
          <TouchableOpacity style={styles.button} onPress={Register}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Register</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity onPress={() => router.push("/auth/Login")}>
            <Text style={styles.loginText}>
              Already have account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  card: {
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 12,
  },

  input: {
    backgroundColor: "#334155",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  label: {
    color: theme.subtext,
    marginBottom: 5,
  },

  pickerBox: {
    backgroundColor: "#334155",
    borderRadius: 8,
    marginBottom: 12,
  },

  button: {
    backgroundColor: theme.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  loginText: {
    textAlign: "center",
    marginTop: 15,
    color: theme.subtext,
  },
});