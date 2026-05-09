import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

const API_URL = "https://niktech-backend.onrender.com";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [records, setRecords] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.id || user?._id || user?.user_id;

  const isTodayDate = (dateValue: string | null) => {
    if (!dateValue) return false;

    const date = new Date(dateValue);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
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

  const getDisplayStatus = (item: any) => {
    if (!item) return "Absent";
    if (item.status === "completed") return "Present";
    if (item.status === "leave") return "Leave";
    if (item.status === "holiday") return "Holiday";
    return "Absent";
  };

  const getStatusColor = (item: any) => {
    if (!item) return "#ef4444";
    if (item.status === "completed") return "#22c55e";
    if (item.status === "leave") return "#38bdf8";
    if (item.status === "holiday") return "#a78bfa";
    return "#ef4444";
  };

  const getStatusIcon = (item: any) => {
    if (!item) return "close";
    if (item.status === "completed") return "checkmark";
    if (item.status === "leave") return "document-text-outline";
    if (item.status === "holiday") return "calendar-clear-outline";
    return "close";
  };

  const loadDashboard = async () => {
    try {
      if (!userId) {
        setRecords([]);
        setTodayRecord(null);
        return;
      }

      const res = await fetch(`${API_URL}/attendance/calendar/${userId}?days=30`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setRecords(data);

        const today = data.find((item) => isTodayDate(item.date));
        setTodayRecord(today || null);
      } else {
        setRecords([]);
        setTodayRecord(null);
      }
    } catch (error) {
      console.log("Dashboard load error", error);
      setRecords([]);
      setTodayRecord(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const stats = useMemo(() => {
    const presentDays = records.filter((item) => item.status === "completed").length;
    const absentDays = records.filter((item) => item.status === "absent").length;
    const leaveDays = records.filter((item) => item.status === "leave").length;
    const holidayDays = records.filter((item) => item.status === "holiday").length;

    const completedDays = presentDays;

    const totalMs = records.reduce((sum, item) => {
      return sum + getDiffMs(item.check_in, item.check_out);
    }, 0);

    const totalHours = Math.floor(totalMs / 3600000);

    return {
      presentDays,
      absentDays,
      leaveDays,
      holidayDays,
      completedDays,
      totalHours,
    };
  }, [records]);

  const todayStatus = getDisplayStatus(todayRecord);
  const statusColor = getStatusColor(todayRecord);
  const todayHours = workHours(todayRecord?.check_in || null, todayRecord?.check_out || null);

  const recentRecords = records.slice(0, 5);

  const ActionCard = ({
    title,
    subtitle,
    icon,
    route,
  }: {
    title: string;
    subtitle: string;
    icon: any;
    route: string;
  }) => (
    <TouchableOpacity style={styles
