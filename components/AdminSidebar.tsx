"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "Kelola Event", href: "/dashboard?tab=events", icon: "events" },
    { label: "Kategori", href: "/dashboard?tab=categories", icon: "categories" },
    { label: "Pengguna", href: "/dashboard?tab=users", icon: "users" },
    { label: "Pengaturan", href: "/dashboard?tab=settings", icon: "settings" },
  ];

  const menuIconPaths: Record<string, string> = {
    dashboard: "M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z",
    events: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Zm3 8h3m-3 3h6",
    categories: "M4 5h16M4 12h16M4 19h16M8 5a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm10 7a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm-5 7a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z",
    users: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7a4 4 0 0 1 0 7m4 9v-1a4 4 0 0 0-3-3.87",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7.4 7.4 0 0 0-.1-1l2-1.5-2-3.5-2.3.9a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.3 2.9a7.6 7.6 0 0 0-1.7 1L6.7 6 4.7 9.5l2 1.5a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.5 2.3-.9a7.6 7.6 0 0 0 1.7 1L11 21h4l.3-2.9a7.6 7.6 0 0 0 1.7-1l2.3.9 2-3.5-2-1.5c.1-.3.1-.7.1-1Z",
  };

  return (
    <aside className="w-full md:w-64 bg-[#244777] border-r border-[#315E9E] p-6 flex flex-col justify-between shrink-0 shadow-lg shadow-[#244777]/15">
      <div className="flex flex-col gap-6">
        {/* Brand Header - Matching dashboard-admin.html */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#244777] via-[#315E9E] to-[#E98268] text-white flex items-center justify-center font-extrabold text-xs">
            A
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-tight">Admin EventHub</h2>
            <span className="text-[11px] text-[#DBE8F8]">Portal Pengelola Kampus</span>
          </div>
        </div>

        <div className="h-px bg-white/15 w-full" />

        {/* Sidebar Nav Items */}
        <nav className="flex flex-col gap-1.5 text-xs sm:text-sm font-medium">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md transition ${
                  isActive
                    ? "bg-[#315E9E] text-white border-r-4 border-[#E98268] font-medium"
                    : "text-[#DBE8F8] hover:bg-white/10 hover:text-white transition-colors"
                }`}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={menuIconPaths[item.icon]} />
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Tautan Balik */}
      <div className="pt-6 border-t border-white/15 flex flex-col gap-2">
        <Link
          href="/"
          className="text-xs font-semibold text-[#DBE8F8] hover:text-white flex items-center gap-1 transition"
        >
          &larr; Lihat Website Utama
        </Link>
      </div>
    </aside>
  );
}
