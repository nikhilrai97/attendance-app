import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getUserById, updateUser } from "../../../utils/api";

export default function EditUser() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadUser = async () => {
    try {
      if (!id) return;

      const res = await getUserById(id as string);
      const user = res.data;

      setName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "user");
      setPhone(user.phone || user.Phone || "");
      setDepartment(user.department || "");
    } catch (err) {
      console.log("Load user error:", err);
      Alert.alert("Error", "User load nahi hua");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUser();
  };

  const validate = () => {
    if (!name.trim()) {
      Alert.alert("Invalid", "Name required hai");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("Invalid", "Email required hai");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("Invalid", "Valid email enter karo");
      return false;
    }

    if (!role.trim()) {
      Alert.alert("Invalid", "Role required hai");
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      await updateUser(id as string, {
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
        phone: phone.trim(),
        department: department.trim(),
      });

      Alert.alert("Success", "User updated successfully");
      router.back();
    } catch (err) {
      console.log("Update error:", err);
      Alert.alert("Error", "User update nahi hua");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    icon,
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
  }: {
    icon: any;
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: "default" | "email-address" | "phone-pad";
  }) => (
    <View style={styles.fieldCard}>
      <View style={styles.fieldHeader}>
        <Ionicons name={icon} size={18} color="#22c55e" />
        <Text style={styles.label}>{label}</Text>
      </View>

      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );

  const RoleButton = ({ value }: { value: string }) => {
    const active = role.toLowerCase() === value.toLowerCase();

    return (
      <TouchableOpacity
        style={[styles.roleBtn, active && styles.roleBtnActive]}
        onPress={() => setRole(value)}
      >
        <Text style={[styles.roleText, active && styles.roleTextActive]}>
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading User...</Text>
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
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#22c55e" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Edit User</Text>

        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{name || "User"}</Text>
          <Text style={styles.heroSub}>{email || "No email"}</Text>
          <Text style={styles.userId}>ID: {id || "N/A"}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Basic Details</Text>

      <Field
        icon="person-outline"
        label="Full Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter name"
      />

      <Field
        icon="mail-outline"
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email"
        keyboardType="email-address"
      />

      <Field
        icon="call-outline"
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
      />

      <Field
        icon="business-outline"
        label="Department"
        value={department}
        onChangeText={setDepartment}
        placeholder="Enter department"
      />

      <Text style={styles.sectionTitle}>Role</Text>

      <View style={styles.roleRow}>
        <RoleButton value="user" />
        <RoleButton value="admin" />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.disabledBtn]}
        onPress={handleUpdate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#052e16" />
        ) : (
          <>
            <Ionicons name="save-outline" size={18} color="#052e16" />
            <Text style={styles.saveText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
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
    fontWeight: "bold",
    fontSize: 18,
  },

  heroCard: {
    backgroundColor: "#1e293b",
    borderRadius: 22,
    padding: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#052e16",
    fontSize: 25,
    fontWeight: "bold",
  },

  heroTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  heroSub: {
    color: "#94a3b8",
    marginTop: 3,
  },

  userId: {
    color: "#64748b",
    marginTop: 5,
    fontSize: 11,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },

  fieldCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  label: {
    color: "#fff",
    fontWeight: "bold",
  },

  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    padding: 13,
    color: "#fff",
  },

  roleRow: {
    flexDirection: "row",
    gap: 10,
  },

  roleBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    alignItems: "center",
  },

  roleBtnActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },

  roleText: {
    color: "#94a3b8",
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  roleTextActive: {
    color: "#052e16",
  },

  saveBtn: {
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    flexDirection: "row",
    gap: 8,
  },

  saveText: {
    color: "#052e16",
    fontWeight: "bold",
    fontSize: 16,
  },

  disabledBtn: {
    opacity: 0.6,
  },
});
