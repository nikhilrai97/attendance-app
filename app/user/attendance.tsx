import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

const API_URL = "https://niktech-backend.onrender.com";
const EXPECTED_HOURS = 8;

export default function Attendance() {
  const { user } = useAuthStore();

  const [records, setRecords] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.id || user?._id || user?.user_id;

  const isToday = (dateValue: string) => {
    const date = new Date(dateValue);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isThisMonth = (dateValue: string) => {
    const date = new Date(dateValue);
    const today = new Date();

    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDate = (value: string | null) => {
    if (!value) return "--";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (value: string | null) => {
    if (!value) return "--";

    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDiffMs = (inTime: string | null, outTime: string | null) => {
    if (!inTime) return 0;

    const start = new Date(inTime);
    const end = outTime ? new Date(outTime) : new Date();
    const diff = end.getTime() - start.getTime();

    return diff > 0 ? diff : 0;
  };

  const workHours = (inTime: string | null, outTime: string | null) => {
    const diff = getDiffMs(inTime, outTime);

    if (!diff) return "--";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    return `${h}h ${m}m`;
  };

  const loadAttendance = async () => {
    try {
      if (!userId) {
        setRecords([]);
        setTodayRecord(null);
        return;
      }

      const res = await fetch(`${API_URL}/attendance/${userId}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) =>
            new Date(b.check_in).getTime() - new Date(a.check_in).getTime()
        );

        setRecords(sorted);

        const today = sorted.find((item) => item.check_in && isToday(item.check_in));
        setTodayRecord(today || null);
      } else {
        setRecords([]);
        setTodayRecord(null);
      }
    } catch (error) {
      console.log("Attendance load error", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  const todayStatus = todayRecord
    ? todayRecord.check_out
      ? "Completed"
      : "Working"
    : "Absent";

  const statusColor = todayRecord
    ? todayRecord.check_out
      ? "#22c55e"
      : "#f59e0b"
    : "#ef4444";

  const monthRecords = useMemo(
    () => records.filter((item) => item.check_in && isThisMonth(item.check_in)),
    [records]
  );

  const presentDays = new Set(
    monthRecords.map((item) => new Date(item.check_in).toDateString())
  ).size;

  const completedDays = monthRecords.filter((item) => item.check_out).length;

  const todayMs = getDiffMs(todayRecord?.check_in || null, todayRecord?.check_out || null);
  const todayHours = todayMs / 3600000;
  const progress = Math.min((todayHours / EXPECTED_HOURS) * 100, 100);

  const totalMonthMs = monthRecords.reduce((sum, item) => {
    return sum + getDiffMs(item.check_in, item.check_out);
  }, 0);

  const totalMonthHours = Math.floor(totalMonthMs / 3600000);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading Attendance...</Text>
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
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Attendance</Text>
          <Text style={styles.title}>My Work Log</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Today Status</Text>
            <Text style={[styles.heroStatus, { color: statusColor }]}>
              {todayStatus}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons
              name={todayRecord?.check_out ? "checkmark" : todayRecord ? "time" : "close"}
              size={18}
              color="#0f172a"
            />
          </View>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {workHours(todayRecord?.check_in || null, todayRecord?.check_out || null)} / {EXPECTED_HOURS}h
          </Text>
        </View>

        <View style={styles.punchGrid}>
          <View style={styles.punchBox}>
            <Ionicons name="log-in-outline" size={22} color="#22c55e" />
            <Text style={styles.punchLabel}>In Punch</Text>
            <Text style={styles.punchTime}>{formatTime(todayRecord?.check_in || null)}</Text>
          </View>

          <View style={styles.punchBox}>
            <Ionicons name="log-out-outline" size={22} color="#fb923c" />
            <Text style={styles.punchLabel}>Out Punch</Text>
            <Text style={styles.punchTime}>{formatTime(todayRecord?.check_out || null)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{presentDays}</Text>
          <Text style={styles.statLabel}>Present Days</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedDays}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalMonthHours}h</Text>
          <Text style={styles.statLabel}>Month Hours</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Records</Text>

      {records.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-clear-outline" size={30} color="#64748b" />
          <Text style={styles.emptyTitle}>No attendance found</Text>
          <Text style={styles.emptyText}>Your fingerprint punches will appear here.</Text>
        </View>
      ) : (
        records.map((item) => (
          <View key={item.id} style={styles.recordCard}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>
                {item.check_in ? new Date(item.check_in).getDate() : "--"}
              </Text>
              <Text style={styles.dateMonth}>
                {item.check_in
                  ? new Date(item.check_in).toLocaleDateString("en-IN", { month: "short" })
                  : "--"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.recordDate}>{formatDate(item.check_in)}</Text>

              <Text style={styles.recordTime}>
                {formatTime(item.check_in)} - {formatTime(item.check_out)}
              </Text>

              <Text style={styles.recordHours}>
                {workHours(item.check_in, item.check_out)}
              </Text>
            </View>

            <View
              style={[
                styles.recordIcon,
                { backgroundColor: item.check_out ? "#dcfce7" : "#fef3c7" },
              ]}
            >
              <Ionicons
                name={item.check_out ? "checkmark-circle" : "time"}
                size={22}
                color={item.check_out ? "#16a34a" : "#d97706"}
              />
            </View>
          </View>
        ))
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
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#94a3b8",
    marginTop: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    backgroundColor: "#1e293b",
    borderRadius: 22,
    padding: 18,
    marginTop: 22,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroLabel: {
    color: "#94a3b8",
    fontSize: 13,
  },

  heroStatus: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 3,
  },

  statusBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  progressWrap: {
    marginTop: 18,
  },

  progressTrack: {
    height: 10,
    backgroundColor: "#0f172a",
    borderRadius: 99,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 99,
  },

  progressText: {
    color: "#cbd5e1",
    marginTop: 8,
    fontWeight: "600",
  },

  punchGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  punchBox: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
  },

  punchLabel: {
    color: "#94a3b8",
    marginTop: 8,
    fontSize: 12,
  },

  punchTime: {
    color: "#fff",
    marginTop: 4,
    fontSize: 17,
    fontWeight: "bold",
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
  },

  statNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  statLabel: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 11,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },

  emptyBox: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 22,
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

  recordCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  dateBox: {
    width: 54,
    height: 60,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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

  recordDate: {
    color: "#fff",
    fontWeight: "bold",
  },

  recordTime: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },

  recordHours: {
    color: "#22c55e",
    marginTop: 4,
    fontWeight: "bold",
  },

  recordIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
