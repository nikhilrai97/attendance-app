import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getUserById, deleteUser } from "../../../utils/api";

export default function UserDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = Array.isArray(id) ? id[0] : id;

  const loadUser = async () => {
    try {
      if (!userId) return;

      const res = await getUserById(userId);
      setUser(res.data);
    } catch (err) {
      console.log("User details error:", err);
      Alert.alert("Error", "User details load nahi ho paayi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUser();
  };

  const handleDelete = () => {
    const deleteNow = async () => {
      try {
        if (!userId) return;

        await deleteUser(userId);
        Alert.alert("Deleted", "User removed");
        router.push("/admin/Users");
      } catch (err) {
        console.log("Delete error:", err);
        Alert.alert("Error", "User delete nahi hua");
      }
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm(`Delete ${user?.name || "this user"}?`);
      if (confirm) deleteNow();
      return;
    }

    Alert.alert("Confirm Delete", `Delete ${user?.name || "this user"}?`, [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: deleteNow },
    ]);
  };

  const InfoRow = ({
    icon,
    label,
    value,
    color = "#22c55e",
  }: {
    icon: any;
    label: string;
    value: any;
    color?: string;
  }) => (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || "N/A"}</Text>
      </View>
    </View>
  );

  const ActionButton = ({
    icon,
    label,
    color,
    onPress,
  }: {
    icon: any;
    label: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading User...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={42} color="#64748b" />
        <Text style={styles.emptyTitle}>User not found</Text>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = user.name || "User";
  const enrolled = Boolean(user.fingerprint_id);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#22c55e" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>User Details</Text>

        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user.email || "No email"}</Text>

        <View
          style={[
            styles.badge,
            { backgroundColor: enrolled ? "#dcfce7" : "#fef3c7" },
          ]}
        >
          <Ionicons
            name={enrolled ? "finger-print-outline" : "time-outline"}
            size={15}
            color={enrolled ? "#166534" : "#92400e"}
          />

          <Text
            style={[
              styles.badgeText,
              { color: enrolled ? "#166534" : "#92400e" },
            ]}
          >
            {enrolled ? "Fingerprint Enrolled" : "Enrollment Pending"}
          </Text>
        </View>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{user.fingerprint_id || "--"}</Text>
          <Text style={styles.statLabel}>Finger ID</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{user.role || "user"}</Text>
          <Text style={styles.statLabel}>Role</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{user.department || "--"}</Text>
          <Text style={styles.statLabel}>Department</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Contact Information</Text>

      <View style={styles.card}>
        <InfoRow icon="mail-outline" label="Email" value={user.email} color="#38bdf8" />
        <InfoRow icon="call-outline" label="Phone" value={user.phone || user.Phone} color="#22c55e" />
      </View>

      <Text style={styles.sectionTitle}>System Information</Text>

      <View style={styles.card}>
        <InfoRow icon="key-outline" label="User ID" value={user.id || user._id || userId} color="#a78bfa" />
        <InfoRow icon="person-circle-outline" label="Role" value={user.role} color="#f59e0b" />
        <InfoRow icon="business-outline" label="Department" value={user.department} color="#38bdf8" />
        <InfoRow icon="finger-print-outline" label="Fingerprint ID" value={user.fingerprint_id} color="#22c55e" />
      </View>

      <Text style={styles.sectionTitle}>Actions</Text>

      <View style={styles.actionRow}>
        <ActionButton
          icon="create-outline"
          label="Edit"
          color="#3b82f6"
          onPress={() => router.push(`/admin/EditUser/${userId}`)}
        />

        <ActionButton
          icon="finger-print-outline"
          label="Enroll"
          color="#8b5cf6"
          onPress={() => router.push(`/admin/EnrollUser/${userId}`)}
        />

        <ActionButton
          icon="trash-outline"
          label="Delete"
          color="#ef4444"
          onPress={handleDelete}
        />
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
    padding: 20,
  },

  loadingText: {
    color: "#94a3b8",
    marginTop: 10,
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },

  backButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },

  backButtonText: {
    color: "#052e16",
    fontWeight: "bold",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },

  topTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  profileCard: {
    backgroundColor: "#1e293b",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    marginTop: 18,
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  avatarText: {
    color: "#052e16",
    fontSize: 34,
    fontWeight: "bold",
  },

  name: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
  },

  email: {
    color: "#94a3b8",
    marginTop: 5,
  },

  badge: {
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  badgeText: {
    fontWeight: "bold",
    fontSize: 12,
  },

  quickStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  statBox: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },

  statNumber: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },

  statLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
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
    padding: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    gap: 12,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    color: "#94a3b8",
    fontSize: 12,
  },

  value: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
