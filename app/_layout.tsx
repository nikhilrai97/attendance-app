import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/Login" />
      <Stack.Screen name="auth/Register" />
      <Stack.Screen name="admin/Dashboard" />
      <Stack.Screen name="main/Attendance" />
      <Stack.Screen name="main/Profile" />
      <Stack.Screen name="admin/Users" />
      <Stack.Screen name="admin/Reports" />
    </Stack>
  );
}