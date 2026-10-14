import { Event, UserProfile, AdminStats } from "@/types";

export const events: Event[] = [
  {
    id: "1",
    title: "AI Revolution: Transformasi Digital Kampus Masa Depan",
    description:
      "Seminar nasional yang menghadirkan pakar teknologi dan AI industri terkemuka untuk membahas bagaimana ekosistem akademik beradaptasi dengan kemajuan kecerdasan buatan.",
    date: "2026-10-28",
    time: "09:00 - 13:00 WIB",
    location: "Auditorium Utama Gedung Rektorat",
    category: "Seminar",
    image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    price: 0,
    organizer: "BEM Fakultas Ilmu Komputer",
    quota: 200,
    registeredCount: 155,
    status: "active",
    isPopular: true,
    contactPic: "+62 812-3456-7890 (Fauzan)",
    requirements: [
      "Mahasiswa aktif semua jurusan (menunjukkan KTM atau NIM saat registrasi)",
      "Membawa laptop atau perangkat catatan",
      "Hadir 15 menit sebelum acara dimulai",
    ],
  },
  {
    id: "2",
    title: "National Tech Workshop & Career Talk 2026",
    description:
      "Workshop intensif hands-on mengenai pengembangan web modern menggunakan Next.js, TypeScript, dan Tailwind CSS, dilanjutkan sesi mentoring karier dengan alumni tech leads.",
    date: "2026-11-05",
    time: "10:00 - 15:30 WIB",
    location: "Lab Komputer Terpadu Gedung B",
    category: "Workshop",
    image:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    price: 35000,
    organizer: "Himpunan Mahasiswa Informatika",
    quota: 80,
    registeredCount: 65,
    status: "active",
    isPopular: true,
    contactPic: "+62 813-9876-5432 (Nadia)",
    requirements: [
      "Memiliki pemahaman dasar HTML, CSS, dan JavaScript",
      "Membawa laptop pribadi dengan Node.js terinstal",
      "Wajib mengikuti seluruh rangkaian sesi hingga akhir",
    ],
  },
  {
    id: "3",
    title: "UI/UX National Design Competition: Tech for Humanity",
    description:
      "Kompetisi desain produk digital tingkat nasional antar mahasiswa. Kembangkan solusi aplikasi yang dapat memecahkan permasalahan nyata di masyarakat.",
    date: "2026-11-15",
    time: "08:00 - 17:00 WIB",
    location: "Daring (Zoom & Figma Live)",
    category: "Lomba",
    image:
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
    price: 50000,
    organizer: "Komunitas Desain Grafis Kampus",
    quota: 100,
    registeredCount: 78,
    status: "active",
    isPopular: true,
    contactPic: "+62 821-1122-3344 (Rifki)",
    requirements: [
      "Tim beranggotakan 2-3 mahasiswa aktif",
      "Mengumpulkan proposal dan prototype interaktif via Figma",
      "Presentasi finalis diadakan secara online",
    ],
  },
  {
    id: "4",
    title: "Beasiswa Pertukaran Mahasiswa Merdeka Batch IV",
    description:
      "Sosialisasi dan pendampingan registrasi beasiswa pertukaran mahasiswa nasional. Dapatkan bantuan biaya hidup, tiket transportasi, dan konversi hingga 20 SKS.",
    date: "2026-10-25",
    time: "13:30 - 16:00 WIB",
    location: "Ruang Seminar Gedung Pusat Mahasiswa",
    category: "Beasiswa",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    price: 0,
    organizer: "Biro Kemahasiswaan & Alumni",
    quota: 300,
    registeredCount: 280,
    status: "active",
    isPopular: false,
    contactPic: "+62 856-7788-9900 (Sekretariat)",
    requirements: [
      "Mahasiswa aktif minimal semester 3 dan maksimal semester 7",
      "IPK minimal 3.00",
      "Surat rekomendasi dari program studi",
    ],
  },
  {
    id: "5",
    title: "Campus Music Fest & Gelar Budaya Nusantara",
    description:
      "Malam pentas seni dan kolaborasi pertunjukan musik mahasiswa bersama bintang tamu nasional untuk merayakan keberagaman budaya nusantara.",
    date: "2026-11-20",
    time: "18:00 - 22:30 WIB",
    location: "Lapangan Terbuka Kampus Utama",
    category: "Konser & Musik",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    price: 25000,
    organizer: "Unit Kegiatan Mahasiswa Kesenian",
    quota: 1500,
    registeredCount: 1200,
    status: "active",
    isPopular: true,
    contactPic: "+62 812-4455-6677 (Ardi)",
    requirements: [
      "Menunjukkan e-ticket QR Code saat pintu masuk",
      "Dilarang membawa senjata tajam atau minuman keras",
      "Pintu gerbang ditutup pukul 19:30 WIB",
    ],
  },
  {
    id: "6",
    title: "Turnamen Futsal Rektor Cup 2026",
    description:
      "Ajang kompetisi olahraga futsal bergengsi antar fakultas se-universitas untuk menjunjung tinggi sportivitas dan solidaritas sivitas akademika.",
    date: "2026-11-28",
    time: "08:00 - 18:00 WIB",
    location: "Gelanggang Olahraga (GOR) Kampus",
    category: "Olahraga",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    price: 150000,
    organizer: "UKM Sepakbola & Futsal Kampus",
    quota: 32,
    registeredCount: 28,
    status: "active",
    isPopular: false,
    contactPic: "+62 878-1234-5678 (Bagus)",
    requirements: [
      "1 tim terdiri dari maksimal 10 pemain (termasuk cadangan) dari fakultas yang sama",
      "Mengumpulkan fotokopi KTM dan surat keterangan aktif",
      "Menghadiri technical meeting wajib",
    ],
  },
];

export const userProfile: UserProfile = {
  name: "Muhammad Fauzan",
  email: "fauzan@mahasiswa.ac.id",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
  nim: "21081010001",
  faculty: "Fakultas Ilmu Komputer",
  major: "Teknik Informatika",
  phone: "+62 812-3456-7890",
  registeredEvents: [
    {
      ticketId: "EVT-202601",
      eventId: "1",
      eventTitle: "AI Revolution: Transformasi Digital Kampus Masa Depan",
      category: "Seminar",
      date: "28 Oktober 2026",
      time: "09:00 - 13:00 WIB",
      location: "Auditorium Utama Gedung Rektorat",
      registeredAt: "2026-10-10",
      ticketStatus: "active",
      qrCodeMock: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=EVT-202601-FAUZAN",
    },
    {
      ticketId: "EVT-202602",
      eventId: "2",
      eventTitle: "National Tech Workshop & Career Talk 2026",
      category: "Workshop",
      date: "05 November 2026",
      time: "10:00 - 15:30 WIB",
      location: "Lab Komputer Terpadu Gedung B",
      registeredAt: "2026-10-12",
      ticketStatus: "active",
      qrCodeMock: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=EVT-202602-FAUZAN",
    },
    {
      ticketId: "EVT-202603",
      eventId: "5",
      eventTitle: "Campus Music Fest & Gelar Budaya Nusantara",
      category: "Konser & Musik",
      date: "20 November 2026",
      time: "18:00 - 22:30 WIB",
      location: "Lapangan Terbuka Kampus Utama",
      registeredAt: "2026-10-14",
      ticketStatus: "active",
      qrCodeMock: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=EVT-202603-FAUZAN",
    },
  ],
};

export const adminStats: AdminStats = {
  totalEvents: 24,
  totalUsers: 1280,
  pendingApprovals: 3,
  activeEvents: 8,
  totalRegistrations: 3450,
};

/**
 * Utility helpers to query mock data
 */
export function getEventById(id: string): Event | undefined {
  return events.find((evt) => evt.id === id);
}

export function getEventsByCategory(category: string): Event[] {
  if (!category || category === "Semua") return events;
  return events.filter(
    (evt) => evt.category.toLowerCase() === category.toLowerCase()
  );
}
