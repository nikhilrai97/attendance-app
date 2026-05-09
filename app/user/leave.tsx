import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

const API_URL = "https://niktech-backend.onrender.com";

export default function LeaveScreen() {
  const { user } = useAuthStore();

  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.id || user?._id || user?.user_id;

  const loadLeaves = async () => {
    try {
      if (!userId) {
        setLeaves([]);
        return;
      }

      const res = await fetch(`${API_URL}/leave/my/${userId}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setLeaves(data);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.log("Leaves load error:", error);
      setLeaves([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaves();
  };

  const validateDate = (value: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(value)) {
      return false;
    }

    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  };

  const applyLeave = async () => {
    if (!userId) {
      Alert.alert("Error", "User not found");
      return;
    }

    if (!startDate.trim() || !endDate.trim() || !reason.trim()) {
      Alert.alert("Invalid", "Please fill all fields");
      return;
    }

    if (!validateDate(startDate.trim()) || !validateDate(endDate.trim())) {
      Alert.alert("Invalid", "Date format should be YYYY-MM-DD");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end.getTime() < start.getTime()) {
      Alert.alert("Invalid", "End date cannot be before start date");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${API_URL}/leave/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          start_date: startDate.trim(),
          end_date: endDate.trim(),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.detail || "Leave apply failed");
        return;
      }

      setReason("");
      setStartDate("");
      setEndDate("");

      Alert.alert("Success", "Leave request submitted");
      loadLeaves();
    } catch (error) {
      console.log("Apply leave error:", error);
      Alert.alert("Error", "Server connection failed");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return "--";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getLeaveDays = (start: string, end: string) => {
    if (!start || !end) return 0;

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(0, 0, 0, 0);

    const diff = endDateObj.getTime() - startDateObj.getTime();

    if (diff < 0) return 0;

    return Math.floor(diff / 86400000) + 1;
  };

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#22c55e";
    if (status === "rejected") return "#ef4444";
    return "#f59e0b";
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved") return "checkmark-circle";
    if (status === "rejected") return "close-circle";
    return "time";
  };

  const stats = useMemo(() => {
    return {
      pending: leaves.filter((item) => item.status === "pending").length,
      approved: leaves.filter((item) => item.status === "approved").length,
      rejected: leaves.filter((item) => item.status === "rejected").length,
    };
  }, [leaves]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading Leaves...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Leave</Text>
          <Text style={styles.title}>Apply Leave</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>My Requests</Text>
          <Text style={styles.summaryNumber}>{leaves.length}</Text>
          <Text style={styles.summarySub}>
            {stats.pending} pending • {stats.approved} approved
          </Text>
        </View>

        <View style={styles.summaryIcon}>
          <Ionicons name="document-text-outline" size={34} color="#052e16" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>New Request</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Start Date</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#64748b"
          value={startDate}
          onChangeText={setStartDate}
          style={styles.input}
        />

        <Text style={styles.label}>End Date</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#64748b"
          value={endDate}
          onChangeText={setEndDate}
          style={styles.input}
        />

        <Text style={styles.label}>Reason</Text>
        <TextInput
          placeholder="Write leave reason"
          placeholderTextColor="#64748b"
          value={reason}
          onChangeText={setReason}
          style={[styles.input, styles.reasonInput]}
          multiline
        />

        <TouchableOpacity
          style={[styles.applyBtn, saving && styles.disabledBtn]}
          onPress={applyLeave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#052e16" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#052e16" />
              <Text style={styles.applyText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Leave History</Text>

      {leaves.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={34} color="#64748b" />
          <Text style={styles.emptyTitle}>No leave request found</Text>
          <Text style={styles.emptyText}>
            Your leave requests will appear here.
          </Text>
        </View>
      ) : (
        leaves.map((item) => {
          const color = getStatusColor(item.status);
          const days = getLeaveDays(item.start_date, item.end_date);

          return (
            <View key={item.id || item._id} style={styles.leaveCard}>
              <View style={styles.leaveTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaveDate}>
                    {formatDate(item.start_date)} - {formatDate(item.end_date)}
                  </Text>
                  <Text style={styles.leaveDays}>{days} day(s)</Text>
                </View>

                <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
                  <Ionicons name={getStatusIcon(item.status)} size={15} color={color} />
                  <Text style={[styles.badgeText, { color }]}>
                    {item.status || "pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Reason</Text>
                <Text style={styles.reasonText}>
                  {item.reason || "No reason added"}
                </Text>
              </View>
            </View>
          );
        })
      )}
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

  summaryNumber: {
    color: "#052e16",
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 4,
  },

  summarySub: {
    color: "#14532d",
    fontWeight: "600",
  },

  summaryIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
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

  formCard: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 15,
  },

  label: {
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

  reasonInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  applyBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  applyText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 15,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  emptyBox: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
  },

  emptyTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
    fontSize: 16,
  },

  emptyText: {
    color: "#94a3b8",
    marginTop: 4,
    textAlign: "center",
  },

  leaveCard: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },

  leaveTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  leaveDate: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  leaveDays: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    fontWeight: "bold",
    fontSize: 11,
    textTransform: "capitalize",
  },

  reasonBox: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },

  reasonLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },

  reasonText: {
    color: "#fff",
    marginTop: 5,
    lineHeight: 20,
  },
});
