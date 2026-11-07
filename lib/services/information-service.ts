import { query, queryOne } from "@/lib/db";
import type { Information, InformationStatus } from "@/types";

export interface InformationFilters {
  category?: string;
  search?: string;
  status?: string;
  authorEmail?: string;
}

export interface CreateInformationDTO {
  id?: string;
  title: string;
  description: string;
  category: string;
  organizer: string;
  institution?: string;
  authorEmail?: string;
  image?: string;
  status?: InformationStatus;
  rejectionReason?: string;
}

interface DatabaseInformationRow {
  id: string;
  title: string;
  description: string;
  category: string;
  organizer: string;
  institution: string | null;
  author_email: string | null;
  image: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: DatabaseInformationRow): Information {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    organizer: row.organizer,
    institution: row.institution || undefined,
    authorEmail: row.author_email || undefined,
    image: row.image || undefined,
    status: (row.status as InformationStatus) || "pending_review",
    rejectionReason: row.rejection_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateInformationInput(
  data: Partial<CreateInformationDTO>,
  isUpdate = false
): string[] {
  const errors: string[] = [];
  if ((!isUpdate || data.title !== undefined) && (!data.title || data.title.trim().length < 3)) {
    errors.push("Judul informasi wajib diisi minimal 3 karakter.");
  }
  if ((!isUpdate || data.description !== undefined) && (!data.description || data.description.trim().length < 10)) {
    errors.push("Deskripsi informasi wajib diisi minimal 10 karakter.");
  }
  if ((!isUpdate || data.category !== undefined) && (!data.category || !data.category.trim())) {
    errors.push("Kategori informasi wajib diisi.");
  }
  if ((!isUpdate || data.organizer !== undefined) && (!data.organizer || !data.organizer.trim())) {
    errors.push("Sumber informasi wajib diisi.");
  }
  return errors;
}

export async function getAllInformation(filters: InformationFilters = {}): Promise<Information[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let index = 1;
  if (filters.category && filters.category !== "Semua") {
    conditions.push(`LOWER(category) = LOWER($${index++})`);
    params.push(filters.category);
  }
  if (filters.search?.trim()) {
    conditions.push(`(title ILIKE $${index} OR description ILIKE $${index} OR organizer ILIKE $${index})`);
    params.push(`%${filters.search.trim()}%`);
    index++;
  }
  if (filters.status && filters.status !== "Semua") {
    conditions.push(`status = $${index++}`);
    params.push(filters.status);
  } else if (!filters.status) {
    conditions.push("status = 'published'");
  }
  if (filters.authorEmail) {
    conditions.push(`author_email = $${index++}`);
    params.push(filters.authorEmail);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query<DatabaseInformationRow>(
    `SELECT * FROM information ${where} ORDER BY created_at DESC;`,
    params
  );
  return rows.map(mapRow);
}

export async function getInformationById(id: string): Promise<Information | null> {
  if (!id) return null;
  const row = await queryOne<DatabaseInformationRow>("SELECT * FROM information WHERE id = $1;", [id]);
  return row ? mapRow(row) : null;
}

export async function createInformation(data: CreateInformationDTO): Promise<Information> {
  const errors = validateInformationInput(data);
  if (errors.length) throw new Error(errors.join(", "));
  const id = data.id || `info_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const row = await queryOne<DatabaseInformationRow>(
    `INSERT INTO information
      (id, title, description, category, organizer, institution, author_email, image, status, rejection_reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *;`,
    [
      id, data.title.trim(), data.description.trim(), data.category.trim(), data.organizer.trim(),
      data.institution?.trim() || null, data.authorEmail?.trim() || null, data.image?.trim() || null,
      data.status || "pending_review", data.rejectionReason?.trim() || null,
    ]
  );
  if (!row) throw new Error("Gagal menyimpan informasi ke database.");
  return mapRow(row);
}

export async function updateInformation(
  id: string,
  data: Partial<CreateInformationDTO>
): Promise<Information | null> {
  const existing = await getInformationById(id);
  if (!existing) return null;
  const errors = validateInformationInput(data, true);
  if (errors.length) throw new Error(errors.join(", "));
  const fields: Array<[keyof CreateInformationDTO, string]> = [
    ["title", "title"], ["description", "description"], ["category", "category"],
    ["organizer", "organizer"], ["institution", "institution"], ["authorEmail", "author_email"],
    ["image", "image"], ["status", "status"], ["rejectionReason", "rejection_reason"],
  ];
  const updates: string[] = [];
  const params: unknown[] = [];
  fields.forEach(([key, column]) => {
    if (data[key] !== undefined) {
      updates.push(`${column} = $${params.length + 1}`);
      params.push(typeof data[key] === "string" ? (data[key] as string).trim() || null : data[key]);
    }
  });
  if (!updates.length) return existing;
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  const row = await queryOne<DatabaseInformationRow>(
    `UPDATE information SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING *;`,
    params
  );
  return row ? mapRow(row) : null;
}

export async function deleteInformation(id: string): Promise<boolean> {
  const rows = await query("DELETE FROM information WHERE id = $1 RETURNING id;", [id]);
  return rows.length > 0;
}
