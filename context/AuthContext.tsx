"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "guest" | "user" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  university?: string;
  avatarUrl?: string | null;
  role: UserRole;
  avatarText: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (data: { name: string; email: string; university?: string; password: string }) => Promise<void>;
  updateProfile: (data: { name: string; email: string; avatarUrl?: string | null; university?: string | null }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Sesi gagal diperiksa.");
        const data = await response.json();
        setUser(data.user ? { ...data.user, avatarText: data.user.name.slice(0, 2).toUpperCase() } : null);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Login gagal.");
    const profile = { ...data, avatarText: data.name.slice(0, 2).toUpperCase() } as UserProfile;
    setUser(profile);
    return profile;
  };

  const register = async (data: { name: string; email: string; university?: string; password: string }) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Registrasi gagal.");
    setUser({ ...result, avatarText: result.name.slice(0, 2).toUpperCase() });
  };

  const updateProfile = async (data: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    university?: string | null;
  }) => {
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Gagal memperbarui profil.");
    setUser({
      ...result,
      avatarText: result.name ? result.name.slice(0, 2).toUpperCase() : "U",
    });
  };

  const logout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Logout gagal.");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
