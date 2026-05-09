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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ExcelJS from "exceljs";

const API_URL = "https://niktech-backend.onrender.com";

type RangeType = 7 | 30 | 90;

export default function ReportsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
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
      setStats(null);
      setReports([]);
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
  const leaveToday = Number(stats?.leave_today || 0);
  const holidayToday = Boolean(stats?.holiday_today);

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

  const formatStatus = (day: any) => {
    if (day.status === "completed") return "Present";
    if (day.status === "leave") return "Leave";
    if (day.status === "holiday") return "Holiday";
    if (day.status === "absent" && day.check_in && !day.check_out) {
      return "Incomplete";
    }

    return "Absent";
  };

  const getExcelStatusColor = (status: string) => {
    const value = status.toLowerCase();

    if (value.includes("present")) return "FFDCFCE7";
    if (value.includes("absent")) return "FFFEE2E2";
    if (value.includes("incomplete")) return "FFFEF3C7";
    if (value.includes("leave")) return "FFE0F2FE";
    if (value.includes("holiday")) return "FFF3E8FF";

    return "FFFFFFFF";
  };

  const styleHeader = (sheet: ExcelJS.Worksheet) => {
    const header = sheet.getRow(1);
    header.height = 25;

    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });
  };

  const styleCellBorder = (cell: ExcelJS.Cell) => {
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      left: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FFE5E7EB" } },
    };
  };

  const exportExcel = async () => {
    try {
      setExporting(true);

      if (Platform.OS !== "web") {
        Alert.alert("Export", "Excel download is available on web build.");
        return;
      }

      const usersRes = await fetch(`${API_URL}/users`);
      const usersData = await usersRes.json();
      const users = Array.isArray(usersData) ? usersData : [];

      const summaryRes = await fetch(
        `${API_URL}/reports/attendance-summary?days=30`
      );
      const summaryData = await summaryRes.json();
      const summaryRows = Array.isArray(summaryData) ? summaryData : [];

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Niktech Secure";
      workbook.created = new Date();

      const summarySheet = workbook.addWorksheet("Summary");
      const dailySheet = workbook.addWorksheet("Daily Details");

      summarySheet.columns = [
        { header: "Name", key: "name", width: 24 },
        { header: "Finger ID", key: "fingerprint_id", width: 14 },
        { header: "Present", key: "present_days", width: 12 },
        { header: "Absent", key: "absent_days", width: 12 },
        { header: "Incomplete", key: "incomplete_days", width: 14 },
        { header: "Leave", key: "leave_days", width: 12 },
        { header: "Holiday", key: "holiday_days", width: 12 },
        { header: "Working Days", key: "working_days", width: 14 },
        { header: "Total Days", key: "total_days", width: 12 },
        { header: "Last In", key: "last_check_in", width: 22 },
        { header: "Last Out", key: "last_check_out", width: 22 },
        { header: "Status", key: "status", width: 14 },
      ];

      dailySheet.columns = [
        { header: "Name", key: "name", width: 24 },
        { header: "Finger ID", key: "fingerprint_id", width: 14 },
        { header: "Date", key: "date", width: 16 },
        { header: "Status", key: "status", width: 14 },
        { header: "In Punch", key: "check_in", width: 22 },
        { header: "Out Punch", key: "check_out", width: 22 },
        { header: "Message", key: "message", width: 30 },
      ];

      summaryRows.forEach((item) => {
        summarySheet.addRow({
          name: item.name || "Unknown",
          fingerprint_id: item.fingerprint_id || "--",
          present_days: item.present_days || 0,
          absent_days: item.absent_days || 0,
          incomplete_days: item.incomplete_days || 0,
          leave_days: item.leave_days || 0,
          holiday_days: item.holiday_days || 0,
          working_days: item.working_days || 0,
          total_days: item.total_days || 30,
          last_check_in: item.last_check_in ? formatTime(item.last_check_in) : "--",
          last_check_out: item.last_check_out ? formatTime(item.last_check_out) : "--",
          status: item.status || "--",
        });
      });

      for (const user of users) {
        const userId = user.id || user._id;

        if (!userId) continue;

        const calendarRes = await fetch(
          `${API_URL}/attendance/calendar/${userId}?days=30`
        );
        const calendarData = await calendarRes.json();

        if (!Array.isArray(calendarData)) continue;

        calendarData.forEach((day) => {
          dailySheet.addRow({
            name: user.name || "Unknown",
            fingerprint_id: user.fingerprint_id || "--",
            date: day.date || "--",
            status: formatStatus(day),
            check_in: day.check_in ? formatTime(day.check_in) : "--",
            check_out: day.check_out ? formatTime(day.check_out) : "--",
            message: day.message || "--",
          });
        });
      }

      styleHeader(summarySheet);
      styleHeader(dailySheet);

      summarySheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        row.height = 22;

        row.eachCell((cell) => {
          styleCellBorder(cell);
        });

        row.getCell("present_days").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDCFCE7" },
        };

        row.getCell("absent_days").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFEE2E2" },
        };

        row.getCell("incomplete_days").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFEF3C7" },
        };

        row.getCell("leave_days").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0F2FE" },
        };

        row.getCell("holiday_days").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3E8FF" },
        };
      });

      dailySheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        row.height = 22;

        const status = String(row.getCell("status").value || "");
        const fillColor = getExcelStatusColor(status);

        row.eachCell((cell) => {
          styleCellBorder(cell);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: fillColor },
          };
        });
      });

      summarySheet.views = [{ state: "frozen", ySplit: 1 }];
      dailySheet.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "attendance-report-30-days.xlsx";
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.log("Excel export error:", error);
      Alert.alert("Error", "Excel report export failed");
    } finally {
      setExporting(false);
    }
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

  const MiniBox = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: string | number;
    color: string;
  }) => (
    <View style={styles.statBox}>
      <Text style={[styles.boxNumber, { color }]}>{value}</Text>
      <Text style={styles.boxLabel}>{label}</Text>
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
            <Text style={styles.heroLabel}>
              {holidayToday ? "Holiday Today" : "Today Attendance"}
            </Text>
            <Text style={styles.heroNumber}>
              {holidayToday ? "OFF" : `${attendanceRate}%`}
            </Text>
            <Text style={styles.heroSub}>
              {presentToday} present, {absentToday} absent, {leaveToday} leave
            </Text>
          </View>

          <View style={styles.heroCircle}>
            <Ionicons
              name={holidayToday ? "calendar-clear-outline" : "analytics-outline"}
              size={34}
              color="#052e16"
            />
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

        <View style={styles.statsRow}>
          <StatCard
            label="On Leave"
            value={leaveToday}
            icon="document-text-outline"
            color="#f59e0b"
          />

          <StatCard
            label="Holiday"
            value={holidayToday ? "Yes" : "No"}
            icon="calendar-clear-outline"
            color="#a78bfa"
          />

          <StatCard
            label="Rate"
            value={`${attendanceRate}%`}
            icon="trending-up-outline"
            color="#22c55e"
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

        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.disabledBtn]}
          onPress={exportExcel}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#052e16" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#052e16" />
              <Text style={styles.exportText}>Export Excel Report</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.noteText}>
          Incomplete means in punch exists but out punch is missing. It is counted as absent.
        </Text>

        <Text style={styles.sectionTitle}>
          Employee Summary ({filteredReports.length})
        </Text>

        {filteredReports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={34} color="#64748b" />
            <Text style={styles.emptyTitle}>No report found</Text>
            <Text style={styles.emptyText}>
              Try changing the search or report range.
            </Text>
          </View>
        ) : (
          filteredReports.map((item) => {
            const totalDays = Number(item.total_days || range);
            const workingDays = Number(item.working_days || totalDays);
            const presentDays = Number(item.present_days || 0);
            const absentDays = Number(item.absent_days || 0);
            const incompleteDays = Number(item.incomplete_days || 0);
            const leaveDays = Number(item.leave_days || 0);
            const holidayDays = Number(item.holiday_days || 0);

            const percent =
              workingDays > 0
                ? Math.round((presentDays / workingDays) * 100)
                : 0;

            const statusColor =
              percent >= 80 ? "#22c55e" : percent >= 50 ? "#f59e0b" : "#ef4444";

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
                      { backgroundColor: `${statusColor}22` },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                      {percent}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: statusColor,
                      },
                    ]}
                  />
                </View>

                <View style={styles.row}>
                  <MiniBox label="Present" value={presentDays} color="#22c55e" />
                  <MiniBox label="Absent" value={absentDays} color="#ef4444" />
                  <MiniBox
                    label="Incomplete"
                    value={incompleteDays}
                    color="#f59e0b"
                  />
                </View>

                <View style={styles.row}>
                  <MiniBox label="Leave" value={leaveDays} color="#38bdf8" />
                  <MiniBox label="Holiday" value={holidayDays} color="#a78bfa" />
                  <MiniBox label="Working" value={workingDays} color="#fff" />
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

  disabledBtn: {
    opacity: 0.6,
  },

  noteText: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
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
