import type { Metadata } from "next";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata: Metadata = {
  title: "Dashboard Admin | EventHub Kampus",
  description: "Panel administrasi pengelolaan event, kategori, dan peserta kampus.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col md:flex-row bg-gray-50 min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-x-hidden">{children}</div>
    </div>
  );
}
