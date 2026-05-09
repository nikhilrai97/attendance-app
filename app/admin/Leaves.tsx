import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://niktech-backend.onrender.com";

type FilterType = "pending" | "approved" | "rejected" | "all";

export default function Leaves() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/leave/all`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setLeaves(data);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.log("Leaves load error:", error);
      setLeaves([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaves();
  };

  const filteredLeaves = useMemo(() => {
    if (filter === "all") return leaves;

    return leaves.filter((item) => item.status === filter);
  }, [leaves, filter]);

  const counts = useMemo(() => {
    return {
      pending: leaves.filter((item) => item.status === "pending").length,
      approved: leaves.filter((item) => item.status === "approved").length,
      rejected: leaves.filter((item) => item.status === "rejected").length,
      all: leaves.length,
    };
  }, [leaves]);

  const formatDate = (value: string | null) => {
    if (!value) return "--";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getLeaveDays = (start: string, end: string) => {
    if (!start || !end) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diff = endDate.getTime() - startDate.getTime();

    if (diff < 0) return 0;

    return Math.floor(diff / 86400000) + 1;
  };

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#22c55e";
    if (status === "rejected") return "#ef4444";
    return "#f59e0b";
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved") return "checkmark-circle";
    if (status === "rejected") return "close-circle";
    return "time";
  };

  const updateLeaveStatus = async (leaveId: string, status: "approved" | "rejected") => {
    try {
      setUpdatingId(leaveId);

      const res = await fetch(`${API_URL}/leave/status/${leaveId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.detail || "Leave update failed");
        return;
      }

      Alert.alert("Success", `Leave ${status}`);
      loadLeaves();
    } catch (error) {
      console.log("Leave status error:", error);
      Alert.alert("Error", "Server connection failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmUpdate = (leaveId: string, status: "approved" | "rejected") => {
    Alert.alert(
      status === "approved" ? "Approve Leave" : "Reject Leave",
      `Are you sure you want to ${status} this leave request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "approved" ? "Approve" : "Reject",
          style: status === "rejected" ? "destructive" : "default",
          onPress: () => updateLeaveStatus(leaveId, status),
        },
      ]
    );
  };

  const FilterButton = ({
    label,
    value,
    count,
  }: {
    label: string;
    value: FilterType;
    count: number;
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
        <Text style={[styles.filterCount, active && styles.filterTextActive]}>
          {count}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: any) => {
    const color = getStatusColor(item.status);
    const days = getLeaveDays(item.start_date, item.end_date);
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name || "Unknown User"}</Text>
            <Text style={styles.dateText}>
              {formatDate(item.start_date)} - {formatDate(item.end_date)}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
            <Ionicons name={getStatusIcon(item.status)} size={15} color={color} />
            <Text style={[styles.badgeText, { color }]}>
              {item.status || "pending"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Ionicons name="calendar-outline" size={17} color="#38bdf8" />
            <Text style={styles.infoLabel}>Days</Text>
            <Text style={styles.infoValue}>{days}</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={17} color="#f59e0b" />
            <Text style={styles.infoLabel}>Applied</Text>
            <Text style={styles.infoValue}>{formatDate(item.applied_at)}</Text>
          </View>
        </View>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonText}>{item.reason || "No reason added"}</Text>
        </View>

        {item.status === "pending" ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => confirmUpdate(item.id, "rejected")}
              disabled={isUpdating}
            >
              <Ionicons name="close-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>
                {isUpdating ? "Updating..." : "Reject"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => confirmUpdate(item.id, "approved")}
              disabled={isUpdating}
            >
              <Ionicons name="checkmark-outline" size={18} color="#052e16" />
              <Text style={styles.approveText}>
                {isUpdating ? "Updating..." : "Approve"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Leave Manager</Text>
          <Text style={styles.title}>Leave Requests</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Pending Requests</Text>
          <Text style={styles.summaryNumber}>{counts.pending}</Text>
          <Text style={styles.summarySub}>
            Approve or reject employee leave requests
          </Text>
        </View>

        <View style={styles.summaryIcon}>
          <Ionicons name="reader-outline" size={34} color="#052e16" />
        </View>
      </View>

      <View style={styles.filterRow}>
        <FilterButton label="Pending" value="pending" count={counts.pending} />
        <FilterButton label="Approved" value="approved" count={counts.approved} />
      </View>

      <View style={styles.filterRow}>
        <FilterButton label="Rejected" value="rejected" count={counts.rejected} />
        <FilterButton label="All" value="all" count={counts.all} />
      </View>

      <Text style={styles.sectionTitle}>Requests</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading Leaves...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLeaves}
        keyExtractor={(item, index) => item.id || item._id || String(index)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={34} color="#64748b" />
            <Text style={styles.emptyTitle}>No leave request found</Text>
            <Text style={styles.emptyText}>
              Selected filter me koi leave request nahi hai.
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

  summaryCard: {
    backgroundColor: "#22c55e",
    borderRadius: 22,
    padding: 20,
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    color: "#052e16",
    fontWeight: "700",
  },

  summaryNumber: {
    color: "#052e16",
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 4,
  },

  summarySub: {
    color: "#14532d",
    fontWeight: "600",
  },

  summaryIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  filterBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },

  filterBtnActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },

  filterText: {
    color: "#94a3b8",
    fontWeight: "bold",
  },

  filterCount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },

  filterTextActive: {
    color: "#052e16",
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
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },

  cardTop: {
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
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  dateText: {
    color: "#94a3b8",
    marginTop: 3,
    fontSize: 12,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    fontWeight: "bold",
    fontSize: 11,
    textTransform: "capitalize",
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
    padding: 11,
  },

  infoLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 5,
  },

  infoValue: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 3,
  },

  reasonBox: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },

  reasonLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },

  reasonText: {
    color: "#fff",
    marginTop: 5,
    lineHeight: 20,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  actionBtn: {
    flex: 1,
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  rejectBtn: {
    backgroundColor: "#ef4444",
  },

  approveBtn: {
    backgroundColor: "#22c55e",
  },

  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },

  approveText: {
    color: "#052e16",
    fontWeight: "bold",
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
