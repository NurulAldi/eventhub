"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Kelola Event", href: "/dashboard?tab=events", icon: "📅" },
    { label: "Kategori", href: "/dashboard?tab=categories", icon: "🏷️" },
    { label: "Pengguna", href: "/dashboard?tab=users", icon: "👥" },
    { label: "Pengaturan", href: "/dashboard?tab=settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-300 p-6 flex flex-col justify-between shrink-0 shadow-xs">
      <div className="flex flex-col gap-6">
        {/* Brand Header - Matching dashboard-admin.html */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded border-2 border-gray-900 flex items-center justify-center font-extrabold text-gray-900 text-xs">
            A
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm leading-tight">Admin EventHub</h2>
            <span className="text-[11px] text-gray-400">Portal Pengelola Kampus</span>
          </div>
        </div>

        <div className="h-px bg-gray-200 w-full" />

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
          &larr; Lihat Website Utama
        </Link>
      </div>
    </aside>
  );
}
