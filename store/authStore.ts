import { create } from "zustand";
import { login } from "../utils/api";

interface AuthState {
  user: any;
  setUser: (user: any) => void;
  logout: () => void;
  loginUser: (email: string, password: string) => Promise<any>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  logout: () => set({ user: null }),

  loginUser: async (email, password) => {
    const res = await login(email, password);

    console.log("LOGIN API RESPONSE:", res.data);

    // 🔥 FIX
    const user = res.data;

    if (!user) {
      throw new Error("Invalid login response");
    }

    // ✅ store user
    set({ user });

    return user; // 👈 important
  },
}));