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
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const API_URL = "https://niktech-backend.onrender.com";

export default function EnrollUser() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [fid, setFid] = useState("");
  const [saving, setSaving] = useState(false);

  const userId = Array.isArray(id) ? id[0] : id;

  const handleEnroll = async () => {
    const fingerprintId = Number(fid);

    if (!fid) {
      Alert.alert("Error", "Enter Fingerprint ID");
      return;
    }

    if (!Number.isInteger(fingerprintId) || fingerprintId <= 0) {
      Alert.alert("Error", "Fingerprint ID valid number hona chahiye");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${API_URL}/add-user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fingerprint_id: fingerprintId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.detail || "Failed to link fingerprint");
        return;
      }

      Alert.alert(
        "Enrollment Started",
        "ESP32 par ab fingerprint enroll process start hoga."
      );

      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to link fingerprint");
    } finally {
      setSaving(false);
    }
  };

  const QuickId = ({ value }: { value: string }) => (
    <TouchableOpacity style={styles.quickBtn} onPress={() => setFid(value)}>
      <Text style={styles.quickText}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#22c55e" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Enroll User</Text>

        <View style={styles.iconBtn}>
          <Ionicons name="finger-print-outline" size={22} color="#22c55e" />
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="finger-print-outline" size={42} color="#052e16" />
        </View>

        <Text style={styles.title}>Fingerprint Enrollment</Text>
        <Text style={styles.subtitle}>
          Fingerprint ID assign karo. ESP32 next check par enrollment start karega.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Selected User ID</Text>
        <Text style={styles.infoValue}>{userId || "N/A"}</Text>
      </View>

      <Text style={styles.sectionTitle}>Fingerprint ID</Text>

      <View style={styles.inputCard}>
        <TextInput
          placeholder="Enter Fingerprint ID"
          placeholderTextColor="#64748b"
          value={fid}
          onChangeText={setFid}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.help}>
          Ye ID fingerprint sensor ke andar save hogi. Har user ka ID unique hona chahiye.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Quick IDs</Text>

      <View style={styles.quickRow}>
        <QuickId value="1" />
        <QuickId value="2" />
        <QuickId value="3" />
        <QuickId value="4" />
        <QuickId value="5" />
      </View>

      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>Next Steps</Text>

        <View style={styles.stepRow}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#22c55e" />
          <Text style={styles.stepText}>Save fingerprint ID here</Text>
        </View>

        <View style={styles.stepRow}>
          <Ionicons name="wifi-outline" size={18} color="#38bdf8" />
          <Text style={styles.stepText}>ESP32 will detect pending enrollment</Text>
        </View>

        <View style={styles.stepRow}>
          <Ionicons name="finger-print-outline" size={18} color="#a78bfa" />
          <Text style={styles.stepText}>Place finger twice on sensor</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, saving && styles.disabledBtn]}
        onPress={handleEnroll}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#052e16" />
        ) : (
          <>
            <Ionicons name="save-outline" size={18} color="#052e16" />
            <Text style={styles.submitText}>Start Enrollment</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },

  topTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  heroCard: {
    backgroundColor: "#1e293b",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    marginTop: 20,
  },

  heroIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  infoCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },

  infoLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },

  infoValue: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 4,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },

  inputCard: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 15,
  },

  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    color: "#fff",
    padding: 14,
    fontSize: 18,
    fontWeight: "bold",
  },

  help: {
    color: "#94a3b8",
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
  },

  quickRow: {
    flexDirection: "row",
    gap: 8,
  },

  quickBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  quickText: {
    color: "#22c55e",
    fontWeight: "bold",
  },

  stepsCard: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 15,
    marginTop: 18,
  },

  stepsTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },

  stepText: {
    color: "#cbd5e1",
    flex: 1,
  },

  submitBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    flexDirection: "row",
    gap: 8,
  },

  submitText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 16,
  },

  disabledBtn: {
    opacity: 0.6,
  },
});
