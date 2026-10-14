"use client";

import React, { createContext, useContext, useState } from "react";

export type UserRole = "guest" | "user" | "admin";

export interface UserProfile {
  name: string;
  email: string;
  nim?: string;
  role: UserRole;
  avatarText: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  loginAsUser: () => void;
  loginAsAdmin: () => void;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const defaultUser: UserProfile = {
  name: "Muhammad Fauzan",
  email: "fauzan@mahasiswa.ac.id",
  nim: "21081010001",
  role: "user",
  avatarText: "MF",
};

const defaultAdmin: UserProfile = {
  name: "Admin BEM Kampus",
  email: "admin.event@kampus.ac.id",
  role: "admin",
  avatarText: "AD",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eventhub_auth_role");
      if (saved === "admin") return defaultAdmin;
      if (saved === "guest") return null;
      if (saved === "user") return defaultUser;
    }
    return defaultUser;
  });

  const loginAsUser = () => {
    setUser(defaultUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("eventhub_auth_role", "user");
    }
  };

  const loginAsAdmin = () => {
    setUser(defaultAdmin);
    if (typeof window !== "undefined") {
      localStorage.setItem("eventhub_auth_role", "admin");
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("eventhub_auth_role", "guest");
    }
  };

  const setUserRole = (role: UserRole) => {
    if (role === "admin") {
      loginAsAdmin();
    } else if (role === "user") {
      loginAsUser();
    } else {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loginAsUser,
        loginAsAdmin,
        logout,
        setUserRole,
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
