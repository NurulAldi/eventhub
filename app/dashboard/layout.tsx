import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard Admin | EventHub Kampus",
  description: "Panel administrasi pengelolaan event, kategori, dan peserta kampus.",
};

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F7F4EE] min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-x-hidden">{children}</div>
    </div>
  );
}
