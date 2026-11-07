import Link from "next/link";
import type { Information } from "@/types";

export default function InformationCard({ item }: { item: Information }) {
  return (
    <article className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl p-5 shadow-xs flex flex-col gap-3">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#315E9E]">{item.category}</span>
      <h2 className="text-lg font-bold text-[#29374A]">{item.title}</h2>
      <p className="text-sm text-[#6F7580] line-clamp-3">{item.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 text-xs text-[#92959C]">
        <span>{item.institution || item.organizer}</span>
        <Link href={`/informasi/${item.id}`} className="font-bold text-[#315E9E] hover:underline">Baca selengkapnya</Link>
      </div>
    </article>
  );
}
