import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../utils/theme";

const API_URL = "https://niktech-backend.onrender.com";

export default function Dashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/stats/today`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.log("Admin dashboard error:", error);
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

  const totalEmployees = Number(stats?.total_employees || 0);
  const presentToday = Number(stats?.present_today || 0);
  const absentToday = Number(stats?.absent_today || 0);
  const attendanceRate =
    totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  const StatCard = ({
    label,
    value,
    icon,
    color,
  }: {
    label: string;
    value: string | number;
    icon: any;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const ActionCard = ({
    title,
    subtitle,
    icon,
    route,
    color,
  }: {
    title: string;
    subtitle: string;
    icon: any;
    route: string;
    color: string;
  }) => (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={() => router.push(route)}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={22} color={color} />
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
          <Text style={styles.eyebrow}>Niktech Secure</Text>
          <Text style={styles.title}>Admin Dashboard</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <View>
          <Text style={styles.heroLabel}>Today Attendance</Text>
          <Text style={styles.heroNumber}>{attendanceRate}%</Text>
          <Text style={styles.heroSub}>
            {presentToday} present out of {totalEmployees}
          </Text>
        </View>

        <View style={styles.heroCircle}>
          <Ionicons name="shield-checkmark-outline" size={34} color="#052e16" />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Employees"
          value={totalEmployees}
          icon="people-outline"
          color="#38bdf8"
        />

        <StatCard
          label="Present"
          value={presentToday}
          icon="checkmark-circle-outline"
          color="#22c55e"
        />

        <StatCard
          label="Absent"
          value={absentToday}
          icon="close-circle-outline"
          color="#ef4444"
        />
      </View>

      <View style={styles.systemCard}>
        <View style={styles.systemLeft}>
          <View style={styles.pulseDot} />
          <View>
            <Text style={styles.systemTitle}>System Online</Text>
            <Text style={styles.systemSub}>ESP32 attendance sync active</Text>
          </View>
        </View>

        <Text style={styles.systemBadge}>Live</Text>
      </View>

      <Text style={styles.sectionTitle}>Admin Tools</Text>

      <ActionCard
        title="Attendance"
        subtitle="View live attendance records"
        icon="calendar-outline"
        route="/main/Attendance"
        color="#22c55e"
      />

      <ActionCard
        title="Users"
        subtitle="Manage employees and fingerprint IDs"
        icon="people-outline"
        route="/admin/Users"
        color="#38bdf8"
      />

      <ActionCard
        title="Reports"
        subtitle="Present, absent and monthly summaries"
        icon="document-text-outline"
        route="/admin/Reports"
        color="#f59e0b"
      />

      <ActionCard
        title="Attendance Settings"
        subtitle="Duplicate punch, working hours and rules"
        icon="settings-outline"
        route="/admin/AttendanceSettings"
        color="#a78bfa"
      />

      <ActionCard
        title="Profile"
        subtitle="View admin account details"
        icon="person-outline"
        route="/main/Profile"
        color="#fb7185"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg || "#0f172a",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    backgroundColor: theme.bg || "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: theme.subtext || "#94a3b8",
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
    color: theme.text || "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },

  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.card || "#1e293b",
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
    fontSize: 44,
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

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: theme.card || "#1e293b",
    borderRadius: 16,
    padding: 14,
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    color: theme.text || "#fff",
    fontSize: 23,
    fontWeight: "bold",
    marginTop: 10,
  },

  statLabel: {
    color: theme.subtext || "#94a3b8",
    marginTop: 3,
    fontSize: 11,
  },

  systemCard: {
    backgroundColor: theme.card || "#1e293b",
    borderRadius: 18,
    padding: 15,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  systemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
  },

  systemTitle: {
    color: theme.text || "#fff",
    fontWeight: "bold",
  },

  systemSub: {
    color: theme.subtext || "#94a3b8",
    marginTop: 3,
    fontSize: 12,
  },

  systemBadge: {
    color: "#052e16",
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    fontWeight: "bold",
    fontSize: 12,
  },

  sectionTitle: {
    color: theme.text || "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },

  actionCard: {
    backgroundColor: theme.card || "#1e293b",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  actionTitle: {
    color: theme.text || "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  actionSubtitle: {
    color: theme.subtext || "#94a3b8",
    fontSize: 12,
    marginTop: 3,
  },
});
