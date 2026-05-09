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
    if (!inTime || !outTime) return 0;

    const start = new Date(inTime);
    const end = new Date(outTime);
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

      const res = await fetch(`${API_URL}/attendance/calendar/${userId}?days=30`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setRecords(data);

        const today = data.find((item) => item.date && isToday(item.date));
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

  const getDisplayStatus = (item: any) => {
    if (!item) return "Absent";

    if (item.status === "completed") return "Present";
    if (item.status === "leave") return "Leave";
    if (item.status === "holiday") return "Holiday";

    return "Absent";
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "#22c55e";
    if (status === "leave") return "#38bdf8";
    if (status === "holiday") return "#a78bfa";
    return "#ef4444";
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed") return "checkmark-circle";
    if (status === "leave") return "document-text";
    if (status === "holiday") return "calendar-clear";
    return "close-circle";
  };

  const todayStatus = getDisplayStatus(todayRecord);
  const statusColor = getStatusColor(todayRecord?.status || "absent");

  const todayMs = getDiffMs(
    todayRecord?.check_in || null,
    todayRecord?.check_out || null
  );

  const todayHours = todayMs / 3600000;
  const progress = Math.min((todayHours / EXPECTED_HOURS) * 100, 100);

  const presentDays = records.filter((item) => item.status === "completed").length;
  const absentDays = records.filter((item) => item.status === "absent").length;
  const leaveDays = records.filter((item) => item.status === "leave").length;
  const holidayDays = records.filter((item) => item.status === "holiday").length;

  const totalMonthMs = records.reduce((sum, item) => {
    return sum + getDiffMs(item.check_in, item.check_out);
  }, 0);

  const totalMonthHours = Math.floor(totalMonthMs / 3600000);

  const recentRecords = useMemo(() => records.slice(0, 30), [records]);

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
            <Text style={styles.heroMessage}>
              {todayRecord?.message || "No punch"}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons
              name={getStatusIcon(todayRecord?.status || "absent")}
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
            <Text style={styles.punchTime}>
              {formatTime(todayRecord?.check_in || null)}
            </Text>
          </View>

          <View style={styles.punchBox}>
            <Ionicons name="log-out-outline" size={22} color="#fb923c" />
            <Text style={styles.punchLabel}>Out Punch</Text>
            <Text style={styles.punchTime}>
              {formatTime(todayRecord?.check_out || null)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{presentDays}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{absentDays}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalMonthHours}h</Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{leaveDays}</Text>
          <Text style={styles.statLabel}>Leave</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{holidayDays}</Text>
          <Text style={styles.statLabel}>Holiday</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{records.length}</Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Last 30 Days</Text>

      {recentRecords.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-clear-outline" size={30} color="#64748b" />
          <Text style={styles.emptyTitle}>No attendance found</Text>
          <Text style={styles.emptyText}>Your attendance records will appear here.</Text>
        </View>
      ) : (
        recentRecords.map((item) => {
          const itemStatus = item.status || "absent";
          const itemColor = getStatusColor(itemStatus);
          const itemIcon = getStatusIcon(itemStatus);

          return (
            <View key={item.id} style={styles.recordCard}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>
                  {item.date ? new Date(item.date).getDate() : "--"}
                </Text>

                <Text style={styles.dateMonth}>
                  {item.date
                    ? new Date(item.date).toLocaleDateString("en-IN", { month: "short" })
                    : "--"}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.recordDate}>{formatDate(item.date)}</Text>

                <Text style={styles.recordTime}>
                  {formatTime(item.check_in)} - {formatTime(item.check_out)}
                </Text>

                <Text style={[styles.recordHours, { color: itemColor }]}>
                  {getDisplayStatus(item)} • {item.message || workHours(item.check_in, item.check_out)}
                </Text>
              </View>

              <View
                style={[
                  styles.recordIcon,
                  { backgroundColor: `${itemColor}22` },
                ]}
              >
                <Ionicons
                  name={itemIcon}
                  size={22}
                  color={itemColor}
                />
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

  heroMessage: {
    color: "#94a3b8",
    marginTop: 4,
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
