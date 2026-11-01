"use client";

import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

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

function readStoredRole(): UserRole {
  const saved = localStorage.getItem("eventhub_auth_role");
  if (saved === "admin" || saved === "guest" || saved === "user") {
    return saved;
  }
  return "user";
}

interface AuthStore {
  getSnapshot: () => UserRole;
  getServerSnapshot: () => UserRole;
  subscribe: (listener: () => void) => () => void;
  hydrate: () => void;
  setRole: (role: UserRole) => void;
}

function createAuthStore(): AuthStore {
  let role: UserRole = "user";
  let isReady = false;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const loadStoredRole = () => {
    role = readStoredRole();
    isReady = true;
    notify();
  };

  return {
    getSnapshot: () => (isReady ? role : "user"),
    getServerSnapshot: () => "user",
    subscribe: (listener) => {
      listeners.add(listener);
      window.addEventListener("storage", loadStoredRole);
      window.addEventListener("eventhub-auth-change", loadStoredRole);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", loadStoredRole);
        window.removeEventListener("eventhub-auth-change", loadStoredRole);
      };
    },
    hydrate: loadStoredRole,
    setRole: (nextRole) => {
      localStorage.setItem("eventhub_auth_role", nextRole);
      role = nextRole;
      isReady = true;
      notify();
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createAuthStore(), []);
  const role = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
  useEffect(() => {
    store.hydrate();
  }, [store]);
  const user = role === "user"
    ? defaultUser
    : role === "admin"
      ? defaultAdmin
      : null;

  const loginAsUser = () => {
    store.setRole("user");
  };

  const loginAsAdmin = () => {
    store.setRole("admin");
  };

  const logout = () => {
    store.setRole("guest");
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
