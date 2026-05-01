import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";

const API_URL = "https://niktech-backend.onrender.com";
const EXPECTED_HOURS = 8;

type FilterType = "today" | "7days" | "30days" | "all";

export default function AttendanceScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("30days");

  const params = useLocalSearchParams();

  const getLoggedUserId = async () => {
    const routeUserId = params.user_id || params.userId || params.id;

    if (routeUserId) {
      return String(routeUserId);
    }

    const savedUser = await AsyncStorage.getItem("user");

    if (savedUser) {
      const user = JSON.parse(savedUser);
      return user.id || user._id || user.user_id || null;
    }

    const savedUserId = await AsyncStorage.getItem("user_id");

    if (savedUserId) {
      return savedUserId;
    }

    return null;
  };

  const loadAttendance = async () => {
    try {
      setError("");

      const id = userId || (await getLoggedUserId());

      if (!id) {
        setError("User login data nahi mila");
        setRecords([]);
        return;
      }

      setUserId(id);

      const res = await fetch(`${API_URL}/attendance/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Attendance load nahi ho paayi");
        setRecords([]);
        return;
      }

      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) =>
            new Date(b.check_in).getTime() - new Date(a.check_in).getTime()
        );

        setRecords(sorted);
      } else {
        setRecords([]);
      }
    } catch (e) {
      console.log("Error loading attendance", e);
      setError("Server se connection nahi ho paaya");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  const isSameDay = (a: Date, b: Date) => {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  };

  const isToday = (value: string | null) => {
    if (!value) return false;
    return isSameDay(new Date(value), new Date());
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

  const filteredRecords = useMemo(() => {
    const dateMap = new Map<string, any>();

    records
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
  }, [records, filter]);

  const todayRecord = useMemo(() => {
    return records.find((item) => item.check_in && isToday(item.check_in)) || null;
  }, [records]);

  const getDiffMs = (inTime: string | null, outTime: string | null, running = false) => {
    if (!inTime) return 0;
    if (!outTime && !running) return 0;

    const start = new Date(inTime);
    const end = outTime ? new Date(outTime) : new Date();
    const diff = end.getTime() - start.getTime();

    return diff > 0 ? diff : 0;
  };

  const workHours = (inTime: string | null, outTime: string | null, running = false) => {
    const diff = getDiffMs(inTime, outTime, running);

    if (!diff) return "--";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    return `${h}h ${m}m`;
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

  const todayMs = getDiffMs(
    todayRecord?.check_in || null,
    todayRecord?.check_out || null,
    true
  );

  const progress = Math.min((todayMs / 3600000 / EXPECTED_HOURS) * 100, 100);

  const completedCount = filteredRecords.filter((item) => item.check_out).length;

  const totalHours = Math.floor(
    filteredRecords.reduce(
      (sum, item) => sum + getDiffMs(item.check_in, item.check_out),
      0
    ) / 3600000
  );

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Attendance</Text>
          <Text style={styles.title}>My Work Log</Text>
        </View>

        {error ? (
          <View style={styles.emptyBox}>
            <Ionicons name="warning-outline" size={34} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity onPress={loadAttendance} style={styles.retryButton}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
                  {workHours(
                    todayRecord?.check_in || null,
                    todayRecord?.check_out || null,
                    true
                  )} / {EXPECTED_HOURS}h
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

            <View style={styles.filterRow}>
              <FilterButton label="Today" value="today" />
              <FilterButton label="7 Days" value="7days" />
              <FilterButton label="30 Days" value="30days" />
              <FilterButton label="All" value="all" />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{filteredRecords.length}</Text>
                <Text style={styles.statLabel}>Present Days</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{completedCount}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{totalHours}h</Text>
                <Text style={styles.statLabel}>Total Hours</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Records</Text>

            {filteredRecords.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-clear-outline" size={34} color="#64748b" />
                <Text style={styles.emptyTitle}>No attendance found</Text>
                <Text style={styles.emptyText}>
                  Is filter ke andar koi attendance record nahi mila.
                </Text>
              </View>
            ) : (
              filteredRecords.map((rec) => (
                <View key={rec.id || rec._id} style={styles.recordCard}>
                  <View style={styles.dateBox}>
                    <Text style={styles.day}>{formatDay(rec.check_in)}</Text>
                    <Text style={styles.month}>{formatMonth(rec.check_in)}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.weekday}>{formatDate(rec.check_in)}</Text>

                    <Text style={styles.time}>
                      {formatTime(rec.check_in)} - {formatTime(rec.check_out)}
                    </Text>

                    <Text style={styles.hours}>
                      {workHours(rec.check_in, rec.check_out)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.recordIcon,
                      { backgroundColor: rec.check_out ? "#dcfce7" : "#fef3c7" },
                    ]}
                  >
                    <Ionicons
                      name={rec.check_out ? "checkmark-circle" : "time"}
                      size={22}
                      color={rec.check_out ? "#16a34a" : "#d97706"}
                    />
                  </View>
                </View>
              ))
            )}
          </>
        )}
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

  heroCard: {
    backgroundColor: "#1e293b",
    borderRadius: 22,
    padding: 18,
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

  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
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

  day: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "bold",
  },

  month: {
    color: "#94a3b8",
    fontSize: 12,
  },

  weekday: {
    color: "#fff",
    fontWeight: "bold",
  },

  time: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },

  hours: {
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

  emptyBox: {
    backgroundColor: "#1e293b",
    padding: 22,
    borderRadius: 18,
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

  errorText: {
    color: "#ef4444",
    marginTop: 10,
    marginBottom: 12,
    textAlign: "center",
  },

  retryButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: "#052e16",
    fontWeight: "bold",
  },
});
