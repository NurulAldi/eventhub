"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, setUserRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // If on admin dashboard, don't show the standard public navbar
  const isDashboard = pathname.startsWith("/dashboard");

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Daftar Event", href: "/event" },
    { label: "Kalender", href: "/kalender" },
  ];

  if (isDashboard) {
    return (
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded border-2 border-gray-900 flex items-center justify-center font-bold text-gray-900 text-sm">
              E
            </span>
            <span className="font-bold text-base text-gray-900">EventHub Admin</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">
            Mode Admin
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition flex items-center gap-1"
          >
            &larr; Lihat Website Utama
          </Link>

          {/* Quick Role Switcher for Testing */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 px-2.5 py-1.5 rounded-md font-medium text-gray-700 flex items-center gap-1"
            >
              Role: <strong className="capitalize">{user?.role || "Tamu"}</strong>
              <span>▼</span>
            </button>
            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                <div className="px-3 py-1.5 font-semibold text-gray-400 border-b border-gray-100">
                  Simulasi Auth
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole("guest");
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                >
                  Tamu (Guest)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole("user");
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                >
                  Mahasiswa (User)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole("admin");
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-900 font-semibold"
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
    <header className="h-20 bg-white border-b border-gray-200 px-6 lg:px-16 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Search */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded border-2 border-gray-900 flex items-center justify-center font-extrabold text-gray-900 text-sm">
            E
          </span>
          <span className="font-bold text-lg text-gray-900 tracking-tight">EventHub Kampus</span>
        </Link>

        {/* Search Bar - Figma Style */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-md px-3.5 py-1.5 w-60 text-xs text-gray-500 focus-within:border-gray-900 transition">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari event..."
            className="bg-transparent border-none outline-none w-full text-xs text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hover:text-gray-900 ${
                isActive ? "text-gray-900 font-bold" : "text-gray-600"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {isLoggedIn && (
          <Link
            href="/profil"
            className={`transition hover:text-gray-900 ${
              pathname === "/profil" ? "text-gray-900 font-bold" : "text-gray-600"
            }`}
          >
            Profil
          </Link>
        )}
      </nav>

      {/* Right Auth Area */}
      <div className="flex items-center gap-3">
        {/* Quick Simulation Mode Switcher */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-300 px-2.5 py-1.5 rounded-md font-medium text-gray-600 flex items-center gap-1 transition"
            title="Klik untuk mengganti status simulasi login"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Simulasi: <strong className="capitalize">{user ? user.role : "Guest"}</strong></span>
            <span className="text-[10px] text-gray-400">▼</span>
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-1.5 font-semibold text-gray-400 border-b border-gray-100">
                Pilih Mode Simulasi
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserRole("guest");
                  setShowRoleSwitcher(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${!isLoggedIn ? "font-bold text-gray-900 bg-gray-50" : "text-gray-700"}`}
              >
                1. Guest (Tamu / Belum Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRole("user");
                  setShowRoleSwitcher(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${user?.role === "user" ? "font-bold text-gray-900 bg-gray-50" : "text-gray-700"}`}
              >
                2. Mahasiswa (User Biasa)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRole("admin");
                  setShowRoleSwitcher(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${user?.role === "admin" ? "font-bold text-gray-900 bg-gray-50" : "text-gray-700"}`}
              >
                3. Admin EventHub
              </button>
            </div>
          )}
        </div>

        {/* Render Guest or Logged In Buttons */}
        {!isLoggedIn ? (
          <>
            <Link
              href="/login"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gray-900 border border-gray-900 rounded-md hover:bg-gray-800 transition"
            >
              Daftar
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-semibold text-gray-900 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition"
              >
                Admin Panel
              </Link>
            )}
            <Link
              href="/profil"
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-gray-300 transition"
            >
              <span className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold text-xs flex items-center justify-center">
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
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
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
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-200 p-6 flex flex-col gap-4 shadow-xl z-50">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-1 ${pathname === link.href ? "text-gray-900 font-bold" : "text-gray-600"}`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                <Link
                  href="/profil"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-1 ${pathname === "/profil" ? "text-gray-900 font-bold" : "text-gray-600"}`}
                >
                  Profil Saya
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1 text-gray-900 font-bold"
                  >
                    Dashboard Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <div className="text-xs text-gray-400 font-medium">Simulasi Status:</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUserRole("guest")}
                className={`px-2 py-1 text-xs rounded border ${!isLoggedIn ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
              >
                Guest
              </button>
              <button
                type="button"
                onClick={() => setUserRole("user")}
                className={`px-2 py-1 text-xs rounded border ${user?.role === "user" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
              >
                Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => setUserRole("admin")}
                className={`px-2 py-1 text-xs rounded border ${user?.role === "admin" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
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
