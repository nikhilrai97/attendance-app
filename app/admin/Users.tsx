import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getUsers, deleteUser } from "../../utils/api";

type User = {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  department?: string;
  role?: string;
  fingerprint_id?: number;
  phone?: string;
};

export default function UsersScreen() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Users load error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    const dep = department.toLowerCase().trim();
    const r = role.toLowerCase().trim();

    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        String(user.fingerprint_id || "").includes(q);

      const matchesDepartment =
        !dep || user.department?.toLowerCase().includes(dep);

      const matchesRole = !r || user.role?.toLowerCase().includes(r);

      return matchesSearch && matchesDepartment && matchesRole;
    });
  }, [users, search, department, role]);

  const totalUsers = users.length;
  const enrolledUsers = users.filter((u) => u.fingerprint_id).length;
  const pendingUsers = totalUsers - enrolledUsers;

  const getUserId = (user: User) => user.id || user._id || "";

  const handleDelete = (user: User) => {
    const userId = getUserId(user);

    if (!userId) {
      Alert.alert("Error", "User id nahi mila");
      return;
    }

    const deleteNow = async () => {
      try {
        await deleteUser(userId);
        loadUsers();
      } catch (err) {
        console.log("Delete error:", err);
        Alert.alert("Error", "User delete nahi hua");
      }
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm(`Delete ${user.name}?`);
      if (confirm) deleteNow();
      return;
    }

    Alert.alert("Confirm Delete", `Delete ${user.name}?`, [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: deleteNow },
    ]);
  };

  const clearFilters = () => {
    setDepartment("");
    setRole("");
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
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const IconButton = ({
    icon,
    color,
    onPress,
  }: {
    icon: any;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.iconButton, { backgroundColor: `${color}22` }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={color} />
    </TouchableOpacity>
  );

  const renderUser = ({ item }: { item: User }) => {
    const userId = getUserId(item);
    const enrolled = Boolean(item.fingerprint_id);

    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name || "Unknown"}
            </Text>

            <View
              style={[
                styles.badge,
                { backgroundColor: enrolled ? "#dcfce7" : "#fef3c7" },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: enrolled ? "#166534" : "#92400e" },
                ]}
              >
                {enrolled ? "Enrolled" : "Pending"}
              </Text>
            </View>
          </View>

          <Text style={styles.email} numberOfLines={1}>
            {item.email || "No email"}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              ID: {item.fingerprint_id || "--"}
            </Text>
            <Text style={styles.metaText}>
              {item.department || "No department"}
            </Text>
            <Text style={styles.metaText}>
              {item.role || "user"}
            </Text>
          </View>

          <View style={styles.actions}>
            <IconButton
              icon="eye-outline"
              color="#38bdf8"
              onPress={() => router.push(`/admin/UserDetails/${userId}`)}
            />

            <IconButton
              icon="create-outline"
              color="#f59e0b"
              onPress={() => router.push(`/admin/EditUser/${userId}`)}
            />

            <IconButton
              icon="finger-print-outline"
              color="#a78bfa"
              onPress={() => router.push(`/admin/EnrollUser/${userId}`)}
            />

            <IconButton
              icon="trash-outline"
              color="#ef4444"
              onPress={() => handleDelete(item)}
            />
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading Users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item, index) => getUserId(item) || String(index)}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>Employees</Text>
                <Text style={styles.title}>User Management</Text>
              </View>

              <TouchableOpacity
                style={styles.addIconBtn}
                onPress={() => router.push("/auth/Register")}
              >
                <Ionicons name="add" size={24} color="#052e16" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <StatCard
                label="Total"
                value={totalUsers}
                icon="people-outline"
                color="#38bdf8"
              />

              <StatCard
                label="Enrolled"
                value={enrolledUsers}
                icon="finger-print-outline"
                color="#22c55e"
              />

              <StatCard
                label="Pending"
                value={pendingUsers}
                icon="time-outline"
                color="#f59e0b"
              />
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder="Search name, email, fingerprint id..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
                style={styles.search}
              />
            </View>

            <View style={styles.toolRow}>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setShowFilter(true)}
              >
                <Ionicons name="options-outline" size={18} color="#22c55e" />
                <Text style={styles.filterText}>Advanced Filter</Text>
              </TouchableOpacity>

              {(department || role) ? (
                <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>
              Showing {filteredUsers.length} of {users.length}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={34} color="#64748b" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptyText}>
              Search ya filter change karke dobara try karo.
            </Text>
          </View>
        }
      />

      <Modal visible={showFilter} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalEyebrow}>Filter</Text>
          <Text style={styles.modalTitle}>Advanced Search</Text>

          <Text style={styles.inputLabel}>Department</Text>
          <TextInput
            placeholder="Example: HR, IT, Sales"
            placeholderTextColor="#94a3b8"
            value={department}
            onChangeText={setDepartment}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Role</Text>
          <TextInput
            placeholder="Example: user, admin"
            placeholderTextColor="#94a3b8"
            value={role}
            onChangeText={setRole}
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowFilter(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalApply} onPress={() => setShowFilter(false)}>
              <Text style={styles.modalApplyText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.modalClear} onPress={clearFilters}>
            <Text style={styles.modalClearText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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

  addIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
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
    marginTop: 8,
  },

  statLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 3,
  },

  searchBox: {
    backgroundColor: "#1e293b",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 16,
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

  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  filterText: {
    color: "#22c55e",
    fontWeight: "bold",
  },

  clearBtn: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },

  clearText: {
    color: "#ef4444",
    fontWeight: "bold",
  },

  sectionTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 18,
  },

  userInfo: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },

  email: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 3,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },

  metaText: {
    color: "#cbd5e1",
    backgroundColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 11,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 24,
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
    textAlign: "center",
    marginTop: 4,
  },

  modal: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0f172a",
  },

  modalEyebrow: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 4,
    marginBottom: 22,
  },

  inputLabel: {
    color: "#94a3b8",
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#334155",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },

  modalCancel: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  modalCancelText: {
    color: "#fff",
    fontWeight: "bold",
  },

  modalApply: {
    flex: 1,
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  modalApplyText: {
    color: "#052e16",
    fontWeight: "bold",
  },

  modalClear: {
    marginTop: 14,
    alignItems: "center",
  },

  modalClearText: {
    color: "#ef4444",
    fontWeight: "bold",
  },
});
