import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

const API_URL = "https://niktech-backend.onrender.com";

type FilterType = "today" | "7days" | "30days" | "all";

export default function History() {
  const { user } = useAuthStore();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("30days");

  const userId = user?.id || user?._id || user?.user_id;

  const fetchHistory = async () => {
    try {
      if (!userId) {
        setData([]);
        return;
      }

      const res = await fetch(`${API_URL}/attendance/${userId}`);
      const records = await res.json();

      if (Array.isArray(records)) {
        const sorted = records.sort(
          (a, b) =>
            new Date(b.check_in).getTime() - new Date(a.check_in).getTime()
        );

        setData(sorted);
      } else {
        setData([]);
      }
    } catch (err) {
      console.log("History error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (value: string | null) => {
    if (!value) return "--";

    return new Date(value).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDay = (value: string | null) => {
    if (!value) return "--";
    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit" });
  };

  const formatMonth = (value: string | null) => {
    if (!value) return "--";
    return new Date(value).toLocaleDateString("en-IN", { month: "short" });
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

  const isSameDay = (a: Date, b: Date) => {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  };

  const withinFilter = (dateValue: string) => {
    const date = new Date(dateValue);
    const today = new Date();

    if (filter === "all") return true;

    if (filter === "today") {
      return isSameDay(date, today);
    }

    const days = filter === "7days" ? 7 : 30;
    const start = new Date();

    start.setDate(today.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    return date >= start;
  };

  const filteredData = useMemo(() => {
    const dateMap = new Map<string, any>();

    data
      .filter((item) => item.check_in && withinFilter(item.check_in))
      .forEach((item) => {
        const key = new Date(item.check_in).toDateString();
        const existing = dateMap.get(key);

        if (!existing) {
          dateMap.set(key, item);
          return;
        }

        const existingHasOut = Boolean(existing.check_out);
        const itemHasOut = Boolean(item.check_out);

        if (itemHasOut && !existingHasOut) {
          dateMap.set(key, item);
          return;
        }

        if (itemHasOut === existingHasOut) {
          const itemTime = new Date(item.check_in).getTime();
          const existingTime = new Date(existing.check_in).getTime();

          if (itemTime > existingTime) {
            dateMap.set(key, item);
          }
        }
      });

    return Array.from(dateMap.values()).sort(
      (a, b) =>
        new Date(b.check_in).getTime() - new Date(a.check_in).getTime()
    );
  }, [data, filter]);

  const stats = useMemo(() => {
    const presentDays = filteredData.length;
    const completed = filteredData.filter((item) => item.check_out).length;

    const totalMs = filteredData.reduce(
      (sum, item) => sum + getDiffMs(item.check_in, item.check_out),
      0
    );

    const totalHours = Math.floor(totalMs / 3600000);

    return {
      presentDays,
      completed,
      totalHours,
    };
  }, [filteredData]);

  const FilterButton = ({
    label,
    value,
  }: {
    label: string;
    value: FilterType;
  }) => {
    const active = filter === value;

    return (
      <TouchableOpacity
        style={[styles.filterBtn, active && styles.filterBtnActive]}
        onPress={() => setFilter(value)}
      >
        <Text style={[styles.filterText, active && styles.filterTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: any) => {
    const completed = Boolean(item.check_out);

    return (
      <View style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
          <View style={styles.datePill}>
            <Text style={styles.dateDay}>{formatDay(item.check_in)}</Text>
            <Text style={styles.dateMonth}>{formatMonth(item.check_in)}</Text>
          </View>

          <View style={styles.timelineLine} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{formatDate(item.check_in)}</Text>
              <Text style={styles.subText}>
                {formatTime(item.check_in)} - {formatTime(item.check_out)}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                { backgroundColor: completed ? "#dcfce7" : "#fef3c7" },
              ]}
            >
              <Ionicons
                name={completed ? "checkmark-circle" : "time"}
                size={16}
                color={completed ? "#16a34a" : "#d97706"}
              />

              <Text
                style={[
                  styles.badgeText,
                  { color: completed ? "#166534" : "#92400e" },
                ]}
              >
                {completed ? "Completed" : "Open"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Ionicons name="log-in-outline" size={16} color="#22c55e" />
              <Text style={styles.infoLabel}>In</Text>
              <Text style={styles.infoValue}>{formatTime(item.check_in)}</Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="log-out-outline" size={16} color="#fb923c" />
              <Text style={styles.infoLabel}>Out</Text>
              <Text style={styles.infoValue}>{formatTime(item.check_out)}</Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={16} color="#38bdf8" />
              <Text style={styles.infoLabel}>Hours</Text>
              <Text style={styles.infoValue}>
                {workHours(item.check_in, item.check_out)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>History</Text>
        <Text style={styles.title}>Attendance Timeline</Text>
      </View>

      <View style={styles.filterRow}>
        <FilterButton label="Today" value="today" />
        <FilterButton label="7 Days" value="7days" />
        <FilterButton label="30 Days" value="30days" />
        <FilterButton label="All" value="all" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.presentDays}</Text>
          <Text style={styles.statLabel}>Present Days</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalHours}h</Text>
          <Text style={styles.statLabel}>Total Hours</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Records</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading History...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => item.id || item._id || String(index)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-clear-outline" size={34} color="#64748b" />
            <Text style={styles.emptyTitle}>No record found</Text>
            <Text style={styles.emptyText}>
              Is filter ke andar attendance record nahi mila.
            </Text>
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
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

  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  filterBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  filterBtnActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },

  filterText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "bold",
  },

  filterTextActive: {
    color: "#052e16",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
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

  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  timelineLeft: {
    width: 58,
    alignItems: "center",
  },

  datePill: {
    width: 48,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  dateDay: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "bold",
  },

  dateMonth: {
    color: "#94a3b8",
    fontSize: 11,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#334155",
    marginTop: 8,
    marginBottom: 8,
  },

  card: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  date: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  subText: {
    color: "#94a3b8",
    marginTop: 4,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },

  infoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  infoBox: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 10,
  },

  infoLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 4,
  },

  infoValue: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 3,
    fontSize: 13,
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
});
