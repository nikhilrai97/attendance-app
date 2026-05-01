import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://niktech-backend.onrender.com";

type RangeType = 7 | 30 | 90;

export default function ReportsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<RangeType>(30);
  const [search, setSearch] = useState("");

  const loadReports = async (selectedRange = range) => {
    try {
      const statsRes = await fetch(`${API_URL}/stats/today`);
      const statsData = await statsRes.json();

      const reportRes = await fetch(
        `${API_URL}/reports/attendance-summary?days=${selectedRange}`
      );
      const reportData = await reportRes.json();

      setStats(statsData);
      setReports(Array.isArray(reportData) ? reportData : []);
    } catch (error) {
      console.log("Reports error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const changeRange = (value: RangeType) => {
    setRange(value);
    setLoading(true);
    loadReports(value);
  };

  const totalEmployees = Number(stats?.total_employees || 0);
  const presentToday = Number(stats?.present_today || 0);
  const absentToday = Number(stats?.absent_today || 0);
  const attendanceRate =
    totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  const filteredReports = useMemo(() => {
    const q = search.toLowerCase().trim();

    return reports
      .filter((item) => {
        if (!q) return true;

        return (
          item.name?.toLowerCase().includes(q) ||
          String(item.fingerprint_id || "").includes(q)
        );
      })
      .sort((a, b) => Number(b.present_days || 0) - Number(a.present_days || 0));
  }, [reports, search]);

  const formatTime = (value: any) => {
    if (!value) return "--";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const exportCSV = async () => {
    const rows = [
      [
        "Name",
        "Fingerprint ID",
        "Present Days",
        "Absent Days",
        "Total Days",
        "Last Check In",
        "Last Check Out",
      ],
      ...filteredReports.map((item) => [
        item.name || "Unknown",
        item.fingerprint_id || "--",
        item.present_days || 0,
        item.absent_days || 0,
        item.total_days || range,
        item.last_check_in ? formatTime(item.last_check_in) : "--",
        item.last_check_out ? formatTime(item.last_check_out) : "--",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const fileName = `attendance-report-${range}-days.csv`;

    if (Platform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);
      return;
    }

    await Share.share({
      title: "Attendance Report",
      message: csv,
    });
  };

  const RangeButton = ({ label, value }: { label: string; value: RangeType }) => {
    const active = range === value;

    return (
      <TouchableOpacity
        style={[styles.rangeBtn, active && styles.rangeBtnActive]}
        onPress={() => changeRange(value)}
      >
        <Text style={[styles.rangeText, active && styles.rangeTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

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

      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading Reports...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Reports</Text>
            <Text style={styles.title}>Attendance Insights</Text>
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
              {presentToday} present, {absentToday} absent
            </Text>
          </View>

          <View style={styles.heroCircle}>
            <Ionicons name="analytics-outline" size={34} color="#052e16" />
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

        <View style={styles.rangeRow}>
          <RangeButton label="7 Days" value={7} />
          <RangeButton label="30 Days" value={30} />
          <RangeButton label="90 Days" value={90} />
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search employee or finger ID..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={exportCSV}>
          <Ionicons name="download-outline" size={18} color="#052e16" />
          <Text style={styles.exportText}>Export CSV</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Employee Summary ({filteredReports.length})
        </Text>

        {filteredReports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={34} color="#64748b" />
            <Text style={styles.emptyTitle}>No report found</Text>
            <Text style={styles.emptyText}>
              Search ya range change karke dobara try karo.
            </Text>
          </View>
        ) : (
          filteredReports.map((item) => {
            const totalDays = Number(item.total_days || range);
            const presentDays = Number(item.present_days || 0);
            const absentDays = Number(item.absent_days || 0);
            const percent =
              totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

            return (
              <View key={item.user_id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.name || "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name || "Unknown"}</Text>
                    <Text style={styles.smallText}>
                      Finger ID: {item.fingerprint_id || "--"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: percent > 0 ? "#dcfce7" : "#fee2e2" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: percent > 0 ? "#166534" : "#991b1b" },
                      ]}
                    >
                      {percent}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>

                <View style={styles.row}>
                  <View style={styles.statBox}>
                    <Text style={styles.boxNumber}>{presentDays}</Text>
                    <Text style={styles.boxLabel}>Present</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.boxNumber}>{absentDays}</Text>
                    <Text style={styles.boxLabel}>Absent</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.boxNumber}>{totalDays}</Text>
                    <Text style={styles.boxLabel}>Days</Text>
                  </View>
                </View>

                <View style={styles.timeBox}>
                  <View style={styles.timeRow}>
                    <Ionicons name="log-in-outline" size={16} color="#22c55e" />
                    <Text style={styles.timeText}>
                      Last In: {formatTime(item.last_check_in)}
                    </Text>
                  </View>

                  <View style={styles.timeRow}>
                    <Ionicons name="log-out-outline" size={16} color="#fb923c" />
                    <Text style={styles.timeText}>
                      Last Out: {formatTime(item.last_check_out)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
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
    backgroundColor: "#1e293b",
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

  rangeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  rangeBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  rangeBtnActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },

  rangeText: {
    color: "#94a3b8",
    fontWeight: "bold",
    fontSize: 12,
  },

  rangeTextActive: {
    color: "#052e16",
  },

  searchBox: {
    backgroundColor: "#1e293b",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },

  search: {
    flex: 1,
    color: "#fff",
    paddingVertical: 12,
  },

  exportBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  exportText: {
    color: "#052e16",
    fontWeight: "bold",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },

  reportCard: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },

  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 18,
  },

  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },

  smallText: {
    color: "#94a3b8",
    marginTop: 3,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    fontWeight: "bold",
    fontSize: 12,
  },

  progressTrack: {
    height: 9,
    backgroundColor: "#0f172a",
    borderRadius: 99,
    marginTop: 14,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 99,
  },

  row: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
  },

  statBox: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },

  boxNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },

  boxLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 3,
    textAlign: "center",
  },

  timeBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 10,
    gap: 5,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  timeText: {
    color: "#cbd5e1",
    fontSize: 12,
  },

  emptyBox: {
    backgroundColor: "#1e293b",
    padding: 24,
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
});
