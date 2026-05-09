import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://niktech-backend.onrender.com";

export default function Holidays() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadHolidays = async () => {
    try {
      const res = await fetch(`${API_URL}/holiday/all`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setHolidays(sorted);
      } else {
        setHolidays([]);
      }
    } catch (error) {
      console.log("Holidays load error:", error);
      setHolidays([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHolidays();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingHolidays = useMemo(() => {
    return holidays.filter((item) => {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0);
      return date >= today;
    });
  }, [holidays]);

  const pastHolidays = holidays.length - upcomingHolidays.length;

  const formatDate = (value: string | null) => {
    if (!value) return "--";

    return new Date(value).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDayNumber = (value: string | null) => {
    if (!value) return "--";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
    });
  };

  const getMonth = (value: string | null) => {
    if (!value) return "--";

    return new Date(value).toLocaleDateString("en-IN", {
      month: "short",
    });
  };

  const validateDate = (value: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(value)) {
      Alert.alert("Invalid Date", "Date format should be YYYY-MM-DD");
      return false;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      Alert.alert("Invalid Date", "Please enter a valid date");
      return false;
    }

    return true;
  };

  const addHoliday = async () => {
    if (!holidayName.trim()) {
      Alert.alert("Invalid", "Holiday name required");
      return;
    }

    if (!holidayDate.trim()) {
      Alert.alert("Invalid", "Holiday date required");
      return;
    }

    if (!validateDate(holidayDate.trim())) return;

    try {
      setSaving(true);

      const res = await fetch(`${API_URL}/holiday/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: holidayName.trim(),
          date: holidayDate.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.detail || "Holiday add failed");
        return;
      }

      setHolidayName("");
      setHolidayDate("");
      setModalVisible(false);
      Alert.alert("Success", "Holiday added successfully");
      loadHolidays();
    } catch (error) {
      console.log("Add holiday error:", error);
      Alert.alert("Error", "Server connection failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteHoliday = async (holidayId: string, name: string) => {
    const runDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/holiday/${holidayId}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          Alert.alert("Error", data.detail || "Holiday delete failed");
          return;
        }

        loadHolidays();
      } catch (error) {
        console.log("Delete holiday error:", error);
        Alert.alert("Error", "Server connection failed");
      }
    };

    if (Platform.OS === "web") {
      const ok = window.confirm(`Delete ${name}?`);
      if (ok) runDelete();
      return;
    }

    Alert.alert("Delete Holiday", `Delete ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: runDelete,
      },
    ]);
  };

  const renderItem = ({ item }: any) => {
    const date = new Date(item.date);
    date.setHours(0, 0, 0, 0);

    const upcoming = date >= today;

    return (
      <View style={styles.card}>
        <View style={styles.datePill}>
          <Text style={styles.dateDay}>{getDayNumber(item.date)}</Text>
          <Text style={styles.dateMonth}>{getMonth(item.date)}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name || "Holiday"}</Text>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>

          <View
            style={[
              styles.badge,
              { backgroundColor: upcoming ? "#dcfce7" : "#334155" },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: upcoming ? "#166534" : "#cbd5e1" },
              ]}
            >
              {upcoming ? "Upcoming" : "Past"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteHoliday(item.id || item._id, item.name || "Holiday")}
        >
          <Ionicons name="trash-outline" size={19} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Holiday Calendar</Text>
          <Text style={styles.title}>Holidays</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <View>
          <Text style={styles.heroLabel}>Upcoming Holidays</Text>
          <Text style={styles.heroNumber}>{upcomingHolidays.length}</Text>
          <Text style={styles.heroSub}>
            {pastHolidays} past holidays in calendar
          </Text>
        </View>

        <View style={styles.heroCircle}>
          <Ionicons name="calendar-clear-outline" size={34} color="#052e16" />
        </View>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-outline" size={20} color="#052e16" />
        <Text style={styles.addText}>Add Holiday</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Holiday List</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading Holidays...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={holidays}
        keyExtractor={(item, index) => item.id || item._id || String(index)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-clear-outline" size={34} color="#64748b" />
            <Text style={styles.emptyTitle}>No holiday added</Text>
            <Text style={styles.emptyText}>
              Add company holidays to exclude them from attendance.
            </Text>
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Holiday</Text>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Holiday Name</Text>
            <TextInput
              placeholder="Example: Independence Day"
              placeholderTextColor="#64748b"
              value={holidayName}
              onChangeText={setHolidayName}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={holidayDate}
              onChangeText={setHolidayDate}
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabledBtn]}
              onPress={addHoliday}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#052e16" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#052e16" />
                  <Text style={styles.saveText}>Save Holiday</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    color: "#94a3b8",
    marginTop: 10,
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
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
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

  heroCard: {
    backgroundColor: "#22c55e",
    borderRadius: 22,
    padding: 20,
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroLabel: {
    color: "#052e16",
    fontWeight: "700",
  },

  heroNumber: {
    color: "#052e16",
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 4,
  },

  heroSub: {
    color: "#14532d",
    fontWeight: "600",
  },

  heroCircle: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  addBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 15,
    padding: 14,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  addText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 15,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  datePill: {
    width: 54,
    height: 62,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  dateDay: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "bold",
  },

  dateMonth: {
    color: "#94a3b8",
    fontSize: 12,
  },

  name: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  dateText: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },

  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    fontWeight: "bold",
    fontSize: 11,
  },

  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
  },

  emptyTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
    fontSize: 16,
  },

  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.82)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  inputLabel: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    padding: 13,
    color: "#fff",
    marginBottom: 14,
  },

  saveBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 15,
    padding: 14,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  saveText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 15,
  },

  disabledBtn: {
    opacity: 0.6,
  },
});
