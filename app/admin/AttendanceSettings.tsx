import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://niktech-backend.onrender.com";

const DEFAULT_SETTINGS = {
  duplicateMinutes: "60",
  reportDays: "30",
  lateAfter: "10:00",
  workingHours: "8",
};

export default function AttendanceSettings() {
  const [duplicateMinutes, setDuplicateMinutes] = useState(DEFAULT_SETTINGS.duplicateMinutes);
  const [reportDays, setReportDays] = useState(DEFAULT_SETTINGS.reportDays);
  const [lateAfter, setLateAfter] = useState(DEFAULT_SETTINGS.lateAfter);
  const [workingHours, setWorkingHours] = useState(DEFAULT_SETTINGS.workingHours);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSaved, setLastSaved] = useState("");

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings/attendance`);
      const data = await res.json();

      setDuplicateMinutes(String(data.duplicate_punch_minutes ?? 60));
      setReportDays(String(data.report_days ?? 30));
      setLateAfter(String(data.late_after ?? "10:00"));
      setWorkingHours(String(data.working_hours ?? 8));
    } catch (error) {
      Alert.alert("Error", "Settings load nahi ho paayi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const validateSettings = () => {
    const duplicate = Number(duplicateMinutes);
    const reports = Number(reportDays);
    const hours = Number(workingHours);

    if (!duplicateMinutes || duplicate <= 0) {
      Alert.alert("Invalid", "Duplicate punch minutes 1 se zyada hona chahiye");
      return false;
    }

    if (!reportDays || reports <= 0) {
      Alert.alert("Invalid", "Report days 1 se zyada hona chahiye");
      return false;
    }

    if (!workingHours || hours <= 0 || hours > 24) {
      Alert.alert("Invalid", "Working hours 1 se 24 ke beech hona chahiye");
      return false;
    }

    if (!/^\d{2}:\d{2}$/.test(lateAfter)) {
      Alert.alert("Invalid", "Late After format HH:MM hona chahiye, jaise 10:00");
      return false;
    }

    return true;
  };

  const saveSettings = async () => {
    if (!validateSettings()) return;

    try {
      setSaving(true);

      const res = await fetch(`${API_URL}/settings/attendance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duplicate_punch_minutes: Number(duplicateMinutes),
          report_days: Number(reportDays),
          late_after: lateAfter,
          working_hours: Number(workingHours),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.detail || "Settings save nahi hui");
        return;
      }

      const savedAt = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      setLastSaved(savedAt);
      Alert.alert("Success", "Settings save ho gayi");
    } catch (error) {
      Alert.alert("Error", "Server se connection nahi ho paaya");
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSettings();
  };

  const applyPreset = (type: "strict" | "normal" | "flexible") => {
    if (type === "strict") {
      setDuplicateMinutes("30");
      setReportDays("30");
      setLateAfter("09:30");
      setWorkingHours("9");
      return;
    }

    if (type === "normal") {
      setDuplicateMinutes("60");
      setReportDays("30");
      setLateAfter("10:00");
      setWorkingHours("8");
      return;
    }

    setDuplicateMinutes("90");
    setReportDays("30");
    setLateAfter("10:30");
    setWorkingHours("8");
  };

  const resetDefaults = () => {
    setDuplicateMinutes(DEFAULT_SETTINGS.duplicateMinutes);
    setReportDays(DEFAULT_SETTINGS.reportDays);
    setLateAfter(DEFAULT_SETTINGS.lateAfter);
    setWorkingHours(DEFAULT_SETTINGS.workingHours);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const SettingCard = ({
    icon,
    color,
    label,
    value,
    onChangeText,
    keyboardType,
    placeholder,
    help,
  }: {
    icon: any;
    color: string;
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    keyboardType?: "default" | "numeric";
    placeholder: string;
    help: string;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.help}>{help}</Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Rules</Text>
            <Text style={styles.title}>Attendance Settings</Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#22c55e" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Current Rule</Text>
            <Text style={styles.summaryTitle}>
              Duplicate under {duplicateMinutes} min
            </Text>
            <Text style={styles.summarySub}>
              Late after {lateAfter} • {workingHours}h workday
            </Text>
          </View>

          <View style={styles.summaryIcon}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#052e16" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Presets</Text>

        <View style={styles.presetRow}>
          <TouchableOpacity style={styles.presetBtn} onPress={() => applyPreset("strict")}>
            <Text style={styles.presetTitle}>Strict</Text>
            <Text style={styles.presetText}>30m</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.presetBtnActive} onPress={() => applyPreset("normal")}>
            <Text style={styles.presetTitleActive}>Normal</Text>
            <Text style={styles.presetTextActive}>60m</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.presetBtn} onPress={() => applyPreset("flexible")}>
            <Text style={styles.presetTitle}>Flexible</Text>
            <Text style={styles.presetText}>90m</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Rules</Text>

        <SettingCard
          icon="repeat-outline"
          color="#f59e0b"
          label="Duplicate Punch Minutes"
          value={duplicateMinutes}
          onChangeText={setDuplicateMinutes}
          keyboardType="numeric"
          placeholder="60"
          help="Itne minutes ke andar second punch duplicate mana jayega."
        />

        <SettingCard
          icon="document-text-outline"
          color="#38bdf8"
          label="Report Days"
          value={reportDays}
          onChangeText={setReportDays}
          keyboardType="numeric"
          placeholder="30"
          help="Reports me last kitne din ka data dikhana hai."
        />

        <SettingCard
          icon="alarm-outline"
          color="#ef4444"
          label="Late After"
          value={lateAfter}
          onChangeText={setLateAfter}
          placeholder="10:00"
          help="Is time ke baad punch late mana jayega. Format: HH:MM."
        />

        <SettingCard
          icon="time-outline"
          color="#22c55e"
          label="Working Hours"
          value={workingHours}
          onChangeText={setWorkingHours}
          keyboardType="numeric"
          placeholder="8"
          help="Daily expected working hours."
        />

        {lastSaved ? (
          <Text style={styles.savedText}>Last saved at {lastSaved}</Text>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.resetButton} onPress={resetDefaults}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#052e16" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#052e16" />
                <Text style={styles.saveText}>Save Settings</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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

  center: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#94a3b8",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eyebrow: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },

  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCard: {
    backgroundColor: "#22c55e",
    borderRadius: 22,
    padding: 20,
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    color: "#052e16",
    fontWeight: "700",
  },

  summaryTitle: {
    color: "#052e16",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },

  summarySub: {
    color: "#14532d",
    marginTop: 4,
    fontWeight: "600",
  },

  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },

  presetRow: {
    flexDirection: "row",
    gap: 10,
  },

  presetBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },

  presetBtnActive: {
    flex: 1,
    backgroundColor: "#22c55e",
    borderRadius: 16,
    padding: 14,
  },

  presetTitle: {
    color: "#fff",
    fontWeight: "bold",
  },

  presetText: {
    color: "#94a3b8",
    marginTop: 4,
  },

  presetTitleActive: {
    color: "#052e16",
    fontWeight: "bold",
  },

  presetTextActive: {
    color: "#14532d",
    marginTop: 4,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 18,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  help: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 12,
  },

  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    padding: 13,
    color: "#fff",
    fontWeight: "600",
  },

  savedText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  resetButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
  },

  resetText: {
    color: "#ef4444",
    fontWeight: "bold",
  },

  saveButton: {
    flex: 2,
    backgroundColor: "#22c55e",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  saveText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 16,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
