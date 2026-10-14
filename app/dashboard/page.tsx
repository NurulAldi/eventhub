import type { Metadata } from "next";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata: Metadata = {
  title: "Dashboard Admin | EventHub Kampus",
  description: "Panel administrasi pengelolaan event, kategori, dan peserta kampus.",
};

export default function AdminDashboardPage() {
  const stats = [
    { title: "Total Event", value: "24", change: "+4 bulan ini" },
    { title: "Total Peserta Terdaftar", value: "1,280", change: "+12% dari target" },
    { title: "Event Berjalan", value: "6", change: "Minggu ini" },
    { title: "Menunggu Persetujuan", value: "3", change: "Perlu ditinjau" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-gray-50 min-h-screen">
      {/* Admin Sidebar Component */}
      <AdminSidebar />

      {/* Main Admin Area */}
      <main className="flex-1 p-6 md:p-10 flex flex-col gap-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Dashboard Admin</h1>
            <p className="text-sm text-gray-500 mt-1">
              Ringkasan aktivitas dan pengelolaan event kampus secara berkala
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition self-start sm:self-auto cursor-pointer"
          >
            + Buat Event Baru
          </button>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2 shadow-xs"
            >
              <span className="text-xs font-medium text-gray-500">{stat.title}</span>
              <span className="text-2xl font-black text-gray-900">{stat.value}</span>
              <span className="text-xs text-emerald-600 font-medium">{stat.change}</span>
            </div>
          ))}
        </div>

        {/* Recent Events Table Shell */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Daftar Event Terkini</h2>
            <span className="text-xs text-gray-500">Menampilkan 5 event terbaru</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
                <tr>
                  <th className="px-6 py-3">Nama Event</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Pendaftar</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3].map((row) => (
                  <tr key={row} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      Workshop Next.js & Tailwind CSS #{row}
                    </td>
                    <td className="px-6 py-4">Teknologi</td>
                    <td className="px-6 py-4">28 Okt 2026</td>
                    <td className="px-6 py-4">155 / 200</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-700">
                        Aktif
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/event/${row}`}
                        className="text-xs font-semibold text-gray-900 hover:underline mr-3"
                      >
                        Detail
                      </Link>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
