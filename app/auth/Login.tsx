import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../store/authStore";

const theme = {
  bg: "#0f172a",
  card: "#1e293b",
  primary: "#22c55e",
  text: "#ffffff",
  subtext: "#94a3b8",
  error: "#ef4444",
};

export default function Login() {
  const router = useRouter();
  const { loginUser, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Email and password required");
      return;
    }

    if (!cleanEmail.includes("@")) {
      setError("Enter valid email address");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const res = await loginUser(cleanEmail, password);
      const user = res?.user;

      if (!user) {
        setError("Invalid server response");
        return;
      }

      setUser(user);

      await AsyncStorage.setItem("user", JSON.stringify(user));
      await AsyncStorage.setItem("user_id", user.id || user._id || user.user_id || "");

      if (user.role === "admin") {
        router.replace("/admin/Dashboard");
      } else {
        router.replace("/user/dashboard");
      }
    } catch (err) {
      console.log("Login error:", err);
      setError("Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.watermark}>
        <Ionicons name="shield-checkmark-outline" size={210} color="#1e293b" />
        <Text style={styles.watermarkText}>NIKTECH</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Ionicons name="shield-checkmark-outline" size={46} color="#052e16" />
          </View>

          <Text style={styles.title}>Niktech Secure</Text>
          <Text style={styles.subtitle}>Smart biometric attendance system</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Login to manage your workspace</Text>
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Enter email"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />

            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#64748b"
              secureTextEntry={secure}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons
                name={secure ? "eye-off-outline" : "eye-outline"}
                size={21}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={17} color={theme.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#052e16" />
            ) : (
              <>
                <Text style={styles.btnText}>Login</Text>
                <Ionicons name="arrow-forward" size={18} color="#052e16" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Ionicons name="finger-print-outline" size={18} color="#22c55e" />
          <Text style={styles.footerText}>Secured with fingerprint attendance</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  watermark: {
    position: "absolute",
    top: 40,
    right: -50,
    opacity: 0.45,
    alignItems: "center",
  },

  watermarkText: {
    color: "#1e293b",
    fontSize: 34,
    fontWeight: "bold",
    marginTop: -35,
    letterSpacing: 0,
  },

  logoWrap: {
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  title: {
    color: theme.text,
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    color: theme.subtext,
    textAlign: "center",
    marginTop: 6,
  },

  card: {
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#334155",
  },

  cardHeader: {
    marginBottom: 18,
  },

  cardTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "bold",
  },

  cardSub: {
    color: theme.subtext,
    marginTop: 4,
  },

  label: {
    color: theme.text,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 10,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 15,
    paddingHorizontal: 13,
    marginBottom: 8,
    gap: 10,
  },

  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 14,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },

  error: {
    color: theme.error,
    flex: 1,
  },

  btn: {
    backgroundColor: theme.primary,
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
  },

  disabledBtn: {
    opacity: 0.7,
  },

  btnText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 16,
  },

  footer: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  footerText: {
    color: theme.subtext,
    fontSize: 12,
  },
});
