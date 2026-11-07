"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUnreadCount, subscribeToNotifications } from "@/lib/notifications";

function NotificationBell({ role, isHydrated }: { role: "user" | "admin"; isHydrated: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isHydrated) return;
    const refresh = () => setUnreadCount(getUnreadCount(role));
    refresh();
    return subscribeToNotifications(refresh);
  }, [isHydrated, role]);

  return (
    <Link href="/notifikasi" aria-label="Notifikasi" className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors">
      <svg
        aria-hidden="true"
        className="h-5 w-5 text-slate-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 17H9m9-2V11a6 6 0 10-12 0v4l-2 2h16l-2-2zm-6 7a2.5 2.5 0 01-2.45-2h4.9A2.5 2.5 0 0112 22z"
        />
      </svg>
      {isHydrated && unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, setUserRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // If on admin dashboard, don't show the standard public navbar
  const isDashboard = pathname.startsWith("/dashboard");

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Daftar Event", href: "/event" },
    { label: "Kalender", href: "/kalender" },
  ];

  if (isDashboard) {
    return (
      <header className="h-16 bg-white/70 backdrop-blur-md border-b border-indigo-100 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              E
            </span>
            <span className="font-bold text-base text-slate-900">EventHub Admin</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
            Mode Admin
          </span>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell role="admin" isHydrated={isHydrated} />
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition flex items-center gap-1"
          >
            &larr; Lihat Website Utama
          </Link>

          {/* Quick Role Switcher for Testing */}
          <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-md font-medium text-slate-700 flex items-center gap-1 active:scale-95 transition-transform"
              >
                Role: <strong className="capitalize">{isHydrated ? user?.role || "Tamu" : "user"}</strong>
                <span>▼</span>
              </button>
              {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-lg shadow-lg py-1 z-50 text-xs">
                <div className="px-3 py-1.5 font-semibold text-slate-400 border-b border-slate-100">
                  Simulasi Auth
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole("guest");
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  Tamu (Guest)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole("user");
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  Mahasiswa (User)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole("admin");
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-900 font-semibold"
                >
                  Admin EventHub
                </button>
              </div>
              )}
            </div>
          </div>
      </header>
    );
  }

  return (
    <header className="h-20 bg-white/70 backdrop-blur-md border-b border-indigo-100 px-6 lg:px-16 flex items-center justify-between sticky top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
            E
          </span>
          <span className="font-bold text-lg text-slate-900 tracking-tight">EventHub Kampus</span>
        </Link>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hover:text-indigo-600 ${
                isActive ? "text-indigo-600 font-semibold" : "text-slate-600"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {isHydrated && isLoggedIn && (
          <Link
            href="/profil"
            className={`transition hover:text-indigo-600 ${
              pathname === "/profil" ? "text-indigo-600 font-semibold" : "text-slate-600"
            }`}
          >
            Profil
          </Link>
        )}
      </nav>

      {/* Right Auth Area */}
      <div className="flex items-center gap-3">
        {isHydrated && isLoggedIn && (
          <NotificationBell role={user?.role === "admin" ? "admin" : "user"} isHydrated={isHydrated} />
        )}
        {/* Quick Simulation Mode Switcher */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-md font-medium text-slate-600 flex items-center gap-1 transition active:scale-95"
            title="Klik untuk mengganti status simulasi login"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Simulasi: <strong className="capitalize">{isHydrated ? user ? user.role : "Guest" : "user"}</strong></span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-1.5 font-semibold text-slate-400 border-b border-slate-100">
                Pilih Mode Simulasi
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserRole("guest");
                  setShowRoleSwitcher(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${!isLoggedIn ? "font-bold text-indigo-700 bg-indigo-50" : "text-slate-700"}`}
              >
                1. Guest (Tamu / Belum Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRole("user");
                  setShowRoleSwitcher(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${user?.role === "user" ? "font-bold text-indigo-700 bg-indigo-50" : "text-slate-700"}`}
              >
                2. Mahasiswa (User Biasa)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRole("admin");
                  setShowRoleSwitcher(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${user?.role === "admin" ? "font-bold text-indigo-700 bg-indigo-50" : "text-slate-700"}`}
              >
                3. Admin EventHub
              </button>
            </div>
          )}
        </div>

        {/* Render Guest or Logged In Buttons */}
        {!isHydrated || !isLoggedIn ? (
          <>
            <Link
              href="/login"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-95 transition-transform"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-transform"
            >
              Daftar
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 active:scale-95 transition-transform"
              >
                Admin Panel
              </Link>
            )}
            <Link
              href="/profil"
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-200 transition"
            >
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.avatarText || "U"}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setUserRole("guest")}
              className="hidden md:inline-block text-xs text-red-600 hover:text-red-700 font-medium ml-1"
            >
              Logout
            </button>
          </div>
        )}

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-indigo-600"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 p-6 flex flex-col gap-4 shadow-xl z-50">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-1 ${pathname === link.href ? "text-indigo-600 font-medium" : "text-slate-600"}`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                <Link
                  href="/profil"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-1 ${pathname === "/profil" ? "text-indigo-600 font-semibold" : "text-slate-600"}`}
                >
                  Profil Saya
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1 text-indigo-600 font-medium"
                  >
                    Dashboard Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <div className="text-xs text-slate-400 font-medium">Simulasi Status:</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUserRole("guest")}
                className={`px-2 py-1 text-xs rounded border active:scale-95 transition-transform ${!isLoggedIn ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200"}`}
              >
                Guest
              </button>
              <button
                type="button"
                onClick={() => setUserRole("user")}
                className={`px-2 py-1 text-xs rounded border active:scale-95 transition-transform ${user?.role === "user" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200"}`}
              >
                Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => setUserRole("admin")}
                className={`px-2 py-1 text-xs rounded border active:scale-95 transition-transform ${user?.role === "admin" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200"}`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
