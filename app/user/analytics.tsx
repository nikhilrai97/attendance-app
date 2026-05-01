import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

const API_URL = "https://niktech-backend.onrender.com";

export default function Analytics() {
  const { user } = useAuthStore();

  const [weekly, setWeekly] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.id || user?._id || user?.user_id;

  const fetchData = async () => {
    try {
      if (!userId) {
        setWeekly([]);
        setMonthly([]);
        setStats({});
        return;
      }

      const [weeklyRes, monthlyRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/attendance/weekly/${userId}`),
        fetch(`${API_URL}/attendance/monthly/${userId}`),
        fetch(`${API_URL}/attendance/stats/${userId}`),
      ]);

      const weeklyData = await weeklyRes.json();
      const monthlyData = await monthlyRes.json();
      const statsData = await statsRes.json();

      setWeekly(Array.isArray(weeklyData) ? weeklyData : []);
      setMonthly(Array.isArray(monthlyData) ? monthlyData : []);
      setStats(statsData || {});
    } catch (error) {
      console.log("Analytics error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const present = Number(stats.present || 0);
  const absent = Number(stats.absent || 0);
  const total = present + absent;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  const totalWeeklyHours = weekly.reduce(
    (sum, item) => sum + Number(item.hours || 0),
    0
  );

  const totalMonthlyHours = monthly.reduce(
    (sum, item) => sum + Number(item.hours || 0),
    0
  );

  const bestDay = useMemo(() => {
    const all = [...weekly].sort(
      (a, b) => Number(b.hours || 0) - Number(a.hours || 0)
    );

    return all[0] || null;
  }, [weekly]);

  const maxWeekly = useMemo(() => {
    const values = weekly.map((item) => Number(item.hours || 0));
    return Math.max(...values, 8);
  }, [weekly]);

  const maxMonthly = useMemo(() => {
    const values = monthly.map((item) => Number(item.hours || 0));
    return Math.max(...values, 8);
  }, [monthly]);

  const StatCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>

      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const WeeklyChart = () => (
    <View style={styles.weeklyGraph}>
      {weekly.length === 0 ? (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No weekly data</Text>
        </View>
      ) : (
        weekly.map((item, index) => {
          const hours = Number(item.hours || 0);
          const height = Math.max((hours / maxWeekly) * 125, hours > 0 ? 8 : 2);

          return (
            <View key={`week-${index}`} style={styles.weekBarItem}>
              <Text style={styles.hourLabel}>{hours.toFixed(1)}</Text>

              <View style={styles.weekBarTrack}>
                <View style={[styles.weekBar, { height }]} />
              </View>

              <Text style={styles.chartLabel}>{item.date}</Text>
            </View>
          );
        })
      )}
    </View>
  );

  const MonthlyMiniChart = () => (
    <View style={styles.monthGrid}>
      {monthly.length === 0 ? (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No monthly data</Text>
        </View>
      ) : (
        monthly.map((item, index) => {
          const hours = Number(item.hours || 0);
          const opacity = Math.min(0.25 + hours / maxMonthly, 1);

          return (
            <View key={`month-${index}`} style={styles.monthItem}>
              <View
                style={[
                  styles.monthDot,
                  {
                    backgroundColor: hours > 0 ? "#38bdf8" : "#334155",
                    opacity,
                  },
                ]}
              />
              <Text style={styles.monthLabel}>{item.day}</Text>
            </View>
          );
        })
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
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
        <Text style={styles.eyebrow}>Insights</Text>
        <Text style={styles.title}>Attendance Analytics</Text>
      </View>

      <View style={styles.scoreCard}>
        <View>
          <Text style={styles.scoreLabel}>Attendance Score</Text>
          <Text style={styles.scoreSub}>
            Based on present and absent records
          </Text>
        </View>

        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>{attendanceRate}</Text>
          <Text style={styles.scorePercent}>%</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="checkmark-circle-outline"
          label="Present"
          value={present}
          color="#22c55e"
        />

        <StatCard
          icon="close-circle-outline"
          label="Absent"
          value={absent}
          color="#ef4444"
        />

        <StatCard
          icon="time-outline"
          label="Month Hours"
          value={`${Math.round(totalMonthlyHours)}h`}
          color="#38bdf8"
        />
      </View>

      <View style={styles.insightCard}>
        <View style={styles.insightIcon}>
          <Ionicons name="trophy-outline" size={22} color="#facc15" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.insightTitle}>Best Day</Text>
          <Text style={styles.insightText}>
            {bestDay
              ? `Day ${bestDay.date}: ${Number(bestDay.hours || 0).toFixed(1)} hours`
              : "No best day yet"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Weekly Performance</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Working Hours</Text>
          <Text style={styles.cardPill}>{totalWeeklyHours.toFixed(1)}h</Text>
        </View>

        <WeeklyChart />
      </View>

      <Text style={styles.sectionTitle}>Monthly Activity</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Daily Activity</Text>
          <Text style={styles.cardPill}>{totalMonthlyHours.toFixed(1)}h</Text>
        </View>

        <MonthlyMiniChart />
      </View>
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
    marginBottom: 18,
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

  scoreCard: {
    backgroundColor: "#1e293b",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scoreLabel: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  scoreSub: {
    color: "#94a3b8",
    marginTop: 5,
    maxWidth: 190,
  },

  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 8,
    borderColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  scoreNumber: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },

  scorePercent: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 8,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 14,
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  statNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },

  statLabel: {
    color: "#94a3b8",
    marginTop: 3,
    fontSize: 11,
  },

  insightCard: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 15,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#422006",
    alignItems: "center",
    justifyContent: "center",
  },

  insightTitle: {
    color: "#fff",
    fontWeight: "bold",
  },

  insightText: {
    color: "#94a3b8",
    marginTop: 3,
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
    borderRadius: 20,
    padding: 15,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  cardTitle: {
    color: "#fff",
    fontWeight: "bold",
  },

  cardPill: {
    color: "#052e16",
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontWeight: "bold",
    fontSize: 12,
  },

  weeklyGraph: {
    height: 170,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  weekBarItem: {
    flex: 1,
    alignItems: "center",
  },

  hourLabel: {
    color: "#94a3b8",
    fontSize: 10,
    marginBottom: 5,
  },

  weekBarTrack: {
    height: 125,
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#0f172a",
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  weekBar: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#22c55e",
  },

  chartLabel: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 6,
  },

  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  monthItem: {
    width: "12%",
    alignItems: "center",
    marginBottom: 8,
  },

  monthDot: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },

  monthLabel: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 4,
  },

  emptyChart: {
    flex: 1,
    minHeight: 125,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: "#94a3b8",
  },
});
