import axios from "axios";

const API = axios.create({
  baseURL: "https://niktech-backend.onrender.com",
});

export const getUserById =(id: string)=>{return API.get(`/users/${id}`);};
// 🔐 Auth
export const login = (email: string, password: string) =>
  API.post("/login", { email, password });

export const register = (data: any) =>
  API.post("/register", data);

// 👤 Users
export const getUsers = async () => {
  const res = await fetch("https://niktech-backend.onrender.com/users");
  const data = await res.json();
  return data;
};

export const addUser = (data: any) =>
  API.post("/add-user", data);

export const deleteUser = (id: string) =>
  API.delete(`/users/${id}`);

export const updateUser = (id: string, data: any) =>
  API.put(`/users/${id}`, data);

// 📊 Attendance
export const checkIn = (data: any) =>
  API.post("/attendance/checkin", data);

export const checkOut = (data: any) =>
  API.post("/attendance/checkout", data);

export default API;