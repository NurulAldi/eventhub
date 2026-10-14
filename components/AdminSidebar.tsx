"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Kelola Event", href: "/event", icon: "📅" },
    { label: "Kalender Kampus", href: "/kalender", icon: "🗓️" },
    { label: "Profil Admin", href: "/profil", icon: "👤" },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between shrink-0">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded border-2 border-gray-900 flex items-center justify-center font-extrabold text-gray-900 text-xs">
            A
          </span>
          <div>
            <h2 className="font-bold text-gray-900 text-sm leading-tight">Admin EventHub</h2>
            <span className="text-[11px] text-gray-400">Portal Pengelola</span>
          </div>
        </div>

        <div className="h-px bg-gray-200 w-full" />

        {/* Sidebar Nav */}
        <nav className="flex flex-col gap-1.5 text-xs sm:text-sm font-medium">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-bold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Tautan Balik */}
      <div className="pt-6 border-t border-gray-200 flex flex-col gap-2">
        <Link
          href="/"
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition"
        >
          &larr; Kembali ke Beranda Utama
        </Link>
      </div>
    </aside>
  );
}
