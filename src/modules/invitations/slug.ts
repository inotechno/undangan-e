import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(3, "Slug minimal 3 karakter")
  .max(60, "Slug maksimal 60 karakter")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda minus");

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return base.length >= 3 ? base : "undangan";
}
