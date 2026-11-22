"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUnreadCount, subscribeToNotifications } from "@/lib/notifications";

function NotificationBell({ role, userId, isHydrated }: { role: "user" | "admin"; userId: string; isHydrated: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isHydrated) return;
    const refresh = () => setUnreadCount(getUnreadCount(userId, role));
    refresh();
    return subscribeToNotifications(refresh);
  }, [isHydrated, role, userId]);

  return (
    <Link href="/notifikasi" aria-label="Notifikasi" className="relative p-2 text-gray-500 hover:text-blue-700 transition-colors">
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17H9m9-2V11a6 6 0 10-12 0v4l-2 2h16l-2-2zm-6 7a2.5 2.5 0 01-2.45-2h4.9A2.5 2.5 0 0112 22z" />
      </svg>
      {isHydrated && unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, isLoading, logoutAndRedirect } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const isDashboard = pathname.startsWith("/dashboard");

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Jelajahi Event", href: "/event" },
    { label: "Kalender", href: "/kalender" },
  ];

  if (isDashboard) {
    return (
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-base text-gray-900">EventHub Admin</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
            Mode Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user?.id && <NotificationBell role="admin" userId={user.id} isHydrated={isHydrated} />}
          <Link href="/" className="text-xs font-semibold text-gray-500 hover:text-blue-700 transition flex items-center gap-1">
            ← Lihat Website Utama
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="font-bold text-lg text-gray-900 tracking-tight">EventHub Kampus</span>
      </Link>

      {/* Center Navigation */}
      <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`pb-0.5 transition-colors border-b-2 ${
                isActive
                  ? "text-blue-700 border-blue-700 font-semibold"
                  : "text-gray-600 border-transparent hover:text-blue-700 hover:border-blue-300"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {isHydrated && isLoggedIn && (
          <Link
            href="/profil"
            className={`pb-0.5 transition-colors border-b-2 ${
              pathname === "/profil"
                ? "text-blue-700 border-blue-700 font-semibold"
                : "text-gray-600 border-transparent hover:text-blue-700 hover:border-blue-300"
            }`}
          >
            Profil
          </Link>
        )}
      </nav>

      {/* Right Area */}
      <div className="flex items-center gap-3">
        {/* Search icon */}
        <Link href="/event" aria-label="Cari Event" className="hidden md:flex p-2 text-gray-500 hover:text-blue-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Link>

        {isHydrated && isLoggedIn && user?.id && (
          <NotificationBell role={user.role === "admin" ? "admin" : "user"} userId={user.id} isHydrated={isHydrated} />
        )}

        {isLoading || !isLoggedIn ? (
          <>
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition"
            >
              Masuk
            </Link>
            <Link
              href="/pengajuan-event"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 active:scale-95 transition-all shadow-sm"
            >
              Ajukan Event
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition"
              >
                Admin Panel
              </Link>
            )}
            <Link
              href="/pengajuan-event"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 active:scale-95 transition-all shadow-sm"
            >
              Ajukan Event
            </Link>
            <Link
              href="/profil"
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-200 transition"
              aria-label="Halaman Profil"
            >
              {user?.avatarUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 bg-blue-700 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <span className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                  {user?.avatarText || "U"}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => void logoutAndRedirect("/")}
              className="hidden md:inline-block text-xs text-red-500 hover:text-red-700 font-medium ml-1"
            >
              Logout
            </button>
          </div>
        )}

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-gray-500 hover:text-blue-700"
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 p-6 flex flex-col gap-4 shadow-lg z-50">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-1 ${pathname === link.href ? "text-blue-700 font-semibold" : "text-gray-600"}`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                <Link
                  href="/profil"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-1 ${pathname === "/profil" ? "text-blue-700 font-semibold" : "text-gray-600"}`}
                >
                  Profil Saya
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1 text-blue-700 font-medium"
                  >
                    Dashboard Admin
                  </Link>
                )}
              </>
            )}
          </nav>
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            {!isLoggedIn ? (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm text-gray-700 font-medium">
                  Masuk
                </Link>
                <Link
                  href="/pengajuan-event"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-4 bg-blue-700 text-white text-sm font-semibold rounded-lg text-center"
                >
                  Ajukan Event
                </Link>
              </>
            ) : (
              <button type="button" onClick={() => void logoutAndRedirect("/")} className="text-xs text-red-500 font-medium text-left">
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
