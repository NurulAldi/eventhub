"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiGetAdminUsers, apiUpdateAdminUser, apiDeleteAdminUser } from "@/lib/api";
import type { AdminUser } from "@/types";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"semua" | "aktif" | "nonaktif">("semua");
  const [selectedUniv, setSelectedUniv] = useState("Semua");

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/");
    }
  }, [router, user?.role]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("Gagal memuat pengguna:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat data pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    let isMounted = true;

    apiGetAdminUsers()
      .then((data) => {
        if (isMounted) setUsers(data);
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Gagal memuat pengguna:", err);
          setError(err instanceof Error ? err.message : "Gagal memuat data pengguna.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 4000);
  };

  // Unique universities list for filter
  const universityList = useMemo(() => {
    const list = new Set<string>();
    users.forEach((u) => {
      if (u.university && u.university.trim()) {
        list.add(u.university.trim());
      }
    });
    return Array.from(list).sort();
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      // Role admin never shown (backend also guarantees this)
      if (u.role !== "user") return false;

      const matchesSearch =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.university && u.university.toLowerCase().includes(query));

      const matchesStatus =
        selectedStatus === "semua" ||
        (selectedStatus === "aktif" && u.isActive) ||
        (selectedStatus === "nonaktif" && !u.isActive);

      const matchesUniv =
        selectedUniv === "Semua" ||
        (u.university && u.university.trim() === selectedUniv);

      return matchesSearch && matchesStatus && matchesUniv;
    });
  }, [users, searchQuery, selectedStatus, selectedUniv]);

  // Statistics
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.isActive).length;
  const inactiveUsersCount = totalUsersCount - activeUsersCount;
  const totalEventsCreated = users.reduce((acc, curr) => acc + (curr.createdEventsCount || 0), 0);

  // Toggle user active status
  const handleToggleStatus = async (targetUser: AdminUser) => {
    const nextStatus = !targetUser.isActive;
    const actionName = nextStatus ? "mengaktifkan" : "menonaktifkan";

    if (!confirm(`Apakah Anda yakin ingin ${actionName} akun "${targetUser.name}"?`)) {
      return;
    }

    try {
      const updated = await apiUpdateAdminUser(targetUser.id, { isActive: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      showNotification(`Akun "${targetUser.name}" berhasil di${nextStatus ? "aktifkan" : "nonaktifkan"}.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status akun.");
    }
};

  // Delete user
  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (
      !confirm(
        `PERINGATAN: Apakah Anda yakin ingin menghapus akun pengguna "${targetUser.name}" (${targetUser.email}) secara permanen dari sistem?`
      )
    ) {
      return;
    }

    try {
      await apiDeleteAdminUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      showNotification(`Pengguna "${targetUser.name}" berhasil dihapus.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus pengguna.");
    }
  };

  if (user?.role !== "admin") return null;

  return (
    <main className="flex-1 p-6 md:p-12 flex flex-col gap-8 bg-[#F7F4EE]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29374A] tracking-tight">
            Manajemen Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7580]">
            Monitoring dan kelola akun pengguna (mahasiswa & penyelenggara) yang terdaftar pada sistem.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="self-start sm:self-auto px-4 py-2 border border-[#E4DCCF] bg-[#FFFCF6] text-[#29374A] hover:bg-[#F0E9DC] rounded-md text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Segarkan Data
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>✓ {actionSuccessMsg}</span>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-xs font-bold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 card-coral border rounded-lg shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider">
            Total Pengguna
          </span>
          <div className="text-3xl font-extrabold card-heading-coral">
            {isLoading ? "..." : totalUsersCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] card-text-coral font-medium">Akun user non-admin</span>
        </div>

        <div className="p-5 card-sage border rounded-lg shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider">
            Pengguna Aktif
          </span>
          <div className="text-3xl font-extrabold card-heading-sage">
            {isLoading ? "..." : activeUsersCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] card-text-sage font-medium">Status akun aktif</span>
        </div>

        <div className="p-5 card-sand border rounded-lg shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider">
            Pengguna Nonaktif
          </span>
          <div className="text-3xl font-extrabold card-heading-sand">
            {isLoading ? "..." : inactiveUsersCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] card-text-sand font-medium">Status akun dinonaktifkan</span>
        </div>

        <div className="p-5 card-royal border rounded-lg shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider">
            Event Pengguna
          </span>
          <div className="text-3xl font-extrabold card-heading-royal">
            {isLoading ? "..." : totalEventsCreated.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] card-text-royal font-medium">Total event diajukan</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4DCCF]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#29374A]">
              Daftar Pengguna Terdaftar ({filteredUsers.length})
            </h2>
            <span className="text-xs text-[#6F7580]">
              Akun pengguna biasa yang terverifikasi dan aktif di platform.
            </span>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, universitas..."
                className="px-3 py-1.5 text-xs bg-[#F7F4EE] border border-[#E4DCCF] rounded-md focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E] w-52 sm:w-64 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1.5 text-xs text-[#92959C] hover:text-[#6F7580] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              aria-label="Filter Status Akun"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as "semua" | "aktif" | "nonaktif")}
              className="px-3 py-1.5 text-xs bg-[#F7F4EE] border border-[#E4DCCF] rounded-md text-[#29374A] outline-none cursor-pointer focus:border-[#315E9E]"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Status: Aktif</option>
              <option value="nonaktif">Status: Nonaktif</option>
            </select>

            {universityList.length > 0 && (
              <select
                aria-label="Filter Universitas"
                value={selectedUniv}
                onChange={(e) => setSelectedUniv(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#F7F4EE] border border-[#E4DCCF] rounded-md text-[#29374A] outline-none cursor-pointer focus:border-[#315E9E] max-w-[200px] truncate"
              >
                <option value="Semua">Semua Universitas</option>
                {universityList.map((univ) => (
                  <option key={univ} value={univ}>
                    {univ}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-[#92959C] animate-pulse">
              Memuat data pengguna dari sistem...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-[#6F7580]">
              <svg className="h-10 w-10 text-[#B9B2A7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              <span className="font-semibold text-sm text-[#29374A]">Tidak ada pengguna yang sesuai</span>
              <p className="text-xs text-[#92959C]">
                {searchQuery || selectedStatus !== "semua" || selectedUniv !== "Semua"
                  ? "Coba ubah kata kunci pencarian atau reset filter di atas."
                  : "Belum ada akun pengguna biasa yang terdaftar."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F7F4EE] border-b border-[#E4DCCF] text-[#6F7580] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Universitas</th>
                  <th className="py-3 px-4 text-center">Event Diajukan</th>
                  <th className="py-3 px-4">Bergabung</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DCCF]/60">
                {filteredUsers.map((u) => {
                  const initials = u.name
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const formattedJoinDate = new Date(u.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={u.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E4DCCF] bg-[#315E9E] shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#315E9E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {initials || "U"}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[#29374A] truncate max-w-[200px]">
                              {u.name}
                            </span>
                            <span className="text-[11px] text-[#6F7580] truncate max-w-[220px]">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* University */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#29374A] truncate max-w-[240px]">
                          {u.university || "Belum diisi"}
                        </span>
                      </td>

                      {/* Created Events Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#CCD9EB] text-[#244777]">
                          {u.createdEventsCount || 0} Event
                        </span>
                      </td>

                      {/* Join Date */}
                      <td className="py-3 px-4 text-xs text-[#6F7580] whitespace-nowrap">
                        {formattedJoinDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}
                        >
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded border transition cursor-pointer ${
                              u.isActive
                                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                            title={u.isActive ? "Nonaktifkan akun pengguna ini" : "Aktifkan akun pengguna ini"}
                          >
                            {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="px-2.5 py-1 text-xs font-semibold rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer"
                            title="Hapus akun pengguna"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
</div>
      </div>
    </main>
  );
}

