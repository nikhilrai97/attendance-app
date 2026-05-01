import axios from "axios";

const API = axios.create({
  baseURL: "https://niktech-backend.onrender.com",
});

export const login = (email: string, password: string) =>
  API.post("/login", { email, password });

export const register = (data: any) =>
  API.post("/register", data);

export const getTodayAttendance = () =>
  API.get("/attendance/today");

export const checkIn = (data: any) =>
  API.post("/attendance/checkin", data);

export const checkOut = (data: any) =>
  API.post("/attendance/checkout", data);

export const getUsers = () =>
  API.get("/users");

export const getTodayStats = () =>
  API.get("/reports/today");

export const updateUser = (id: string, data: any) =>
  API.put(`/users/${id}`, data);

export default API;