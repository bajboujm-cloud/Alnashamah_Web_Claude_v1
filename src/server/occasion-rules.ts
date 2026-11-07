import "server-only";
import { db } from "@/server/db";
import { isSeasonVisible } from "@/lib/availability";

/**
 * Occasions whose orders can't include "Order includes" (head, intestines, tripe …), e.g. Eid Al-Adha
 * sacrifices. Set on the seasonal offer in the admin; applies only while that offer is shown.
 */
export async function noExtrasOccasions(): Promise<{ occasion: string; noteEn: string; noteAr: string }[]> {
  const rows = await db.query.seasonalCollections.findMany();
  return rows
    .filter((c) => c.noExtras && c.occasion !== "none" && isSeasonVisible(c))
    .map((c) => ({ occasion: c.occasion, noteEn: c.noExtrasNoteEn, noteAr: c.noExtrasNoteAr }));
}
