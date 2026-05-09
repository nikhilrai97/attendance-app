import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

const API_URL = "https://niktech-backend.onrender.com";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [records, setRecords] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.id || user?._id || user?.user_id;

  const isTodayDate = (dateValue: string | null) => {
    if (!dateValue) return false;

    const date = new Date(dateValue);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
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

  const getDisplayStatus = (item: any) => {
    if (!item) return "Absent";
    if (item.status === "completed") return "Present";
    if (item.status === "leave") return "Leave";
    if (item.status === "holiday") return "Holiday";
    return "Absent";
  };

  const getStatusColor = (item: any) => {
    if (!item) return "#ef4444";
    if (item.status === "completed") return "#22c55e";
    if (item.status === "leave") return "#38bdf8";
    if (item.status === "holiday") return "#a78bfa";
    return "#ef4444";
  };

  const getStatusIcon = (item: any) => {
    if (!item) return "close";
    if (item.status === "completed") return "checkmark";
    if (item.status === "leave") return "document-text-outline";
    if (item.status === "holiday") return "calendar-clear-outline";
    return "close";
  };

  const loadDashboard = async () => {
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

        const today = data.find((item) => isTodayDate(item.date));
        setTodayRecord(today || null);
      } else {
        setRecords([]);
        setTodayRecord(null);
      }
    } catch (error) {
      console.log("Dashboard load error", error);
      setRecords([]);
      setTodayRecord(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const stats = useMemo(() => {
    const presentDays = records.filter((item) => item.status === "completed").length;
    const absentDays = records.filter((item) => item.status === "absent").length;
    const leaveDays = records.filter((item) => item.status === "leave").length;

    const totalMs = records.reduce((sum, item) => {
      return sum + getDiffMs(item.check_in, item.check_out);
    }, 0);

    const totalHours = Math.floor(totalMs / 3600000);

    return {
      presentDays,
      absentDays,
      leaveDays,
      totalHours,
    };
  }, [records]);

  const todayStatus = getDisplayStatus(todayRecord);
  const statusColor = getStatusColor(todayRecord);
  const todayHours = workHours(
    todayRecord?.check_in || null,
    todayRecord?.check_out || null
  );

  const recentRecords = records.slice(0, 5);

  const ActionCard = ({
    title,
    subtitle,
    icon,
    route,
  }: {
    title: string;
    subtitle: string;
    icon: any;
    route: string;
  }) => (
    <TouchableOpacity style={styles.actionCard} onPress={() => router.push(route)}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color="#22c55e" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  );

  const StatCard = ({
    value,
    label,
    color,
  }: {
    value: string | number;
    label: string;
    color: string;
  }) => (
    <View style={styles.miniCard}>
      <Text style={[styles.miniNumber, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.name}>{user?.name || "User"}</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusTop}>
          <View>
            <Text style={styles.statusLabel}>Today Status</Text>
            <Text style={[styles.statusValue, { color: statusColor }]}>
              {todayStatus}
            </Text>
            <Text style={styles.statusMessage}>
              {todayRecord?.message || "Daily attendance summary"}
            </Text>
          </View>

          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <Ionicons
              name={getStatusIcon(todayRecord)}
              size={20}
              color="#0f172a"
            />
          </View>
        </View>

        <View style={styles.punchGrid}>
          <View style={styles.punchBox}>
            <Ionicons name="log-in-outline" size={21} color="#22c55e" />
            <Text style={styles.punchLabel}>In Punch</Text>
            <Text style={styles.punchTime}>
              {formatTime(todayRecord?.check_in || null)}
            </Text>
          </View>

          <View style={styles.punchBox}>
            <Ionicons name="log-out-outline" size={21} color="#fb923c" />
            <Text style={styles.punchLabel}>Out Punch</Text>
            <Text style={styles.punchTime}>
              {formatTime(todayRecord?.check_out || null)}
            </Text>
          </View>
        </View>

        <View style={styles.hoursBox}>
          <Ionicons name="time-outline" size={18} color="#38bdf8" />
          <Text style={styles.hoursText}>Working Hours: {todayHours}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard value={stats.presentDays} label="Present" color="#22c55e" />
        <StatCard value={stats.absentDays} label="Absent" color="#ef4444" />
      </View>

      <View style={styles.statsRow}>
        <StatCard value={stats.leaveDays} label="Leave" color="#38bdf8" />
        <StatCard value={stats.totalHours + "h"} label="Month Hours" color="#f59e0b" />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <ActionCard
        title="My Profile"
        subtitle="View and update profile"
        icon="person-outline"
        route="/user/profile"
      />

      <ActionCard
        title="My Attendance"
        subtitle="Daily work log and punch summary"
        icon="calendar-outline"
        route="/user/attendance"
      />

      <ActionCard
        title="Attendance History"
        subtitle="Filter old attendance records"
        icon="list-outline"
        route="/user/history"
      />

      <ActionCard
        title="Attendance Analytics"
        subtitle="View monthly insights"
        icon="bar-chart-outline"
        route="/user/analytics"
      />

      <ActionCard
        title="Apply Leave"
        subtitle="Request leave approval"
        icon="document-text-outline"
        route="/user/leave"
      />

      <Text style={styles.sectionTitle}>Recent Days</Text>

      {recentRecords.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-clear-outline" size={30} color="#64748b" />
          <Text style={styles.emptyTitle}>No records found</Text>
        </View>
      ) : (
        recentRecords.map((item, index) => (
          <View key={item.date || index} style={styles.recordCard}>
            <View style={styles.recordLeft}>
              <Text style={styles.recordDate}>
                {item.date
                  ? new Date(item.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })
                  : "--"}
              </Text>
              <Text style={styles.recordTime}>
                {formatTime(item.check_in)} - {formatTime(item.check_out)}
              </Text>
            </View>

            <View
              style={[
                styles.recordBadge,
                { backgroundColor: `${getStatusColor(item)}22` },
              ]}
            >
              <Text style={[styles.recordBadgeText, { color: getStatusColor(item) }]}>
                {getDisplayStatus(item)}
              </Text>
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

  title: {
    color: "#94a3b8",
    fontSize: 15,
  },

  name: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 20,
  },

  statusCard: {
    backgroundColor: "#1e293b",
    padding: 18,
    borderRadius: 20,
    marginTop: 22,
  },

  statusTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusLabel: {
    color: "#94a3b8",
    fontSize: 13,
  },

  statusValue: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 3,
  },

  statusMessage: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  punchGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  punchBox: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 15,
    padding: 14,
  },

  punchLabel: {
    color: "#94a3b8",
    marginTop: 7,
    fontSize: 12,
  },

  punchTime: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 3,
    fontSize: 16,
  },

  hoursBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 13,
    gap: 8,
  },

  hoursText: {
    color: "#e2e8f0",
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  miniCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 15,
    padding: 15,
  },

  miniNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },

  miniLabel: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },

  actionCard: {
    backgroundColor: "#1e293b",
    borderRadius: 15,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },

  actionTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  actionSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
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
  },

  recordCard: {
    backgroundColor: "#1e293b",
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  recordLeft: {
    flex: 1,
  },

  recordDate: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  recordTime: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },

  recordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  recordBadgeText: {
    fontWeight: "bold",
    fontSize: 12,
  },
});
