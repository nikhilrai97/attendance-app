import React, { useEffect, useState } from "react";
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

  const formatTime = (value: string | null) => {
    if (!value) return "--";

    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const workHours = (inTime: string | null, outTime: string | null) => {
    if (!inTime) return "--";

    const start = new Date(inTime);
    const end = outTime ? new Date(outTime) : new Date();
    const diff = end.getTime() - start.getTime();

    if (diff < 0) return "--";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    return `${h}h ${m}m`;
  };

  const loadDashboard = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/attendance/${user.id}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setRecords(data);

        const today = data.find((item) => item.check_in && isToday(item.check_in));
        setTodayRecord(today || null);
      }
    } catch (error) {
      console.log("Dashboard load error", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
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

  const monthPresentDays = new Set(
    records
      .filter((item) => item.check_in && isThisMonth(item.check_in))
      .map((item) => new Date(item.check_in).toDateString())
  ).size;

  const completedDays = records.filter(
    (item) => item.check_in && item.check_out && isThisMonth(item.check_in)
  ).length;

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
          </View>

          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>

        <View style={styles.punchGrid}>
          <View style={styles.punchBox}>
            <Ionicons name="log-in-outline" size={20} color="#22c55e" />
            <Text style={styles.punchLabel}>In Punch</Text>
            <Text style={styles.punchTime}>
              {formatTime(todayRecord?.check_in || null)}
            </Text>
          </View>

          <View style={styles.punchBox}>
            <Ionicons name="log-out-outline" size={20} color="#f97316" />
            <Text style={styles.punchLabel}>Out Punch</Text>
            <Text style={styles.punchTime}>
              {formatTime(todayRecord?.check_out || null)}
            </Text>
          </View>
        </View>

        <View style={styles.hoursBox}>
          <Ionicons name="time-outline" size={18} color="#38bdf8" />
          <Text style={styles.hoursText}>
            Working Hours: {workHours(todayRecord?.check_in || null, todayRecord?.check_out || null)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.miniCard}>
          <Text style={styles.miniNumber}>{monthPresentDays}</Text>
          <Text style={styles.miniLabel}>Present This Month</Text>
        </View>

        <View style={styles.miniCard}>
          <Text style={styles.miniNumber}>{completedDays}</Text>
          <Text style={styles.miniLabel}>Completed Days</Text>
        </View>
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
        subtitle="Check in and out records"
        icon="calendar-outline"
        route="/user/attendance"
      />

      <ActionCard
        title="Attendance History"
        subtitle="See older attendance"
        icon="list-outline"
        route="/user/history"
      />

      <ActionCard
        title="Attendance Analytics"
        subtitle="View monthly insights"
        icon="bar-chart-outline"
        route="/user/analytics"
      />
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    borderRadius: 18,
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
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 3,
  },

  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },

  punchGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  punchBox: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 14,
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
    borderRadius: 12,
    gap: 8,
  },

  hoursText: {
    color: "#e2e8f0",
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  miniCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 15,
  },

  miniNumber: {
    color: "#fff",
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
});
