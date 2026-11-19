import "server-only";
import { prisma } from "./db";

/** Writes one line to the admin activity log. It never stops the action it belongs to. */
export async function logAdmin(entry: { action: string; targetType: string; targetId: string; targetName: string; detail?: string }): Promise<void> {
  try {
    await prisma.adminAction.create({ data: { ...entry, detail: entry.detail ?? "" } });
  } catch {
    // The log is a record, not part of the work. A failure here must not undo what the admin did.
  }
}
