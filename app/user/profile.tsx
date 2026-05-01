import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

export default function Profile() {
  const { user } = useAuthStore();

  const userId = user?.id || user?._id || user?.user_id || "N/A";
  const name = user?.name || "User";
  const email = user?.email || "N/A";
  const phone = user?.phone || user?.Phone || "N/A";
  const role = user?.role || "N/A";
  const fingerprintId = user?.fingerprint_id || "N/A";
  const department = user?.department || "N/A";

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string | number;
  }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color="#22c55e" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.badge}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#052e16" />
          <Text style={styles.badgeText}>{role}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Account Details</Text>

      <View style={styles.card}>
        <InfoRow icon="person-outline" label="Full Name" value={name} />
        <InfoRow icon="mail-outline" label="Email" value={email} />
        <InfoRow icon="call-outline" label="Phone" value={phone} />
        <InfoRow icon="business-outline" label="Department" value={department} />
      </View>

      <Text style={styles.sectionTitle}>System Details</Text>

      <View style={styles.card}>
        <InfoRow icon="key-outline" label="User ID" value={userId} />
        <InfoRow icon="finger-print-outline" label="Fingerprint ID" value={fingerprintId} />
        <InfoRow icon="person-circle-outline" label="Role" value={role} />
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

  headerCard: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
  },

  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#052e16",
  },

  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },

  email: {
    color: "#94a3b8",
    marginTop: 5,
  },

  badge: {
    marginTop: 12,
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  badgeText: {
    color: "#052e16",
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
});
