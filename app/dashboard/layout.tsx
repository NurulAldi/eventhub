import type { Metadata } from "next";
import { Suspense } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata: Metadata = {
  title: "Dashboard Admin | EventHub Kampus",
  description: "Panel administrasi pengelolaan kegiatan dan informasi kampus.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F7F4EE] min-h-screen">
      <Suspense fallback={<aside className="w-full md:w-64 bg-[#244777]" />}>
        <AdminSidebar />
      </Suspense>
      <div className="flex-1 flex flex-col overflow-x-hidden">{children}</div>
    </div>
  );
}
