import "server-only";
import { db } from "@/lib/db";

export function listOwnServices(professionalId: string) {
  return db.service.findMany({
    where: { professional_id: professionalId },
    orderBy: [{ position: "asc" }, { created_at: "asc" }],
  });
}

export function getOwnService(professionalId: string, id: string) {
  return db.service.findFirst({ where: { id, professional_id: professionalId } });
}
