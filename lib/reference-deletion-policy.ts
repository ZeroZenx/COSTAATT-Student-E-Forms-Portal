import { hasAnyRole } from "./auth";
import type { SsoUser } from "./types";

export const REFERENCE_DELETION_KINDS = ["course", "crn", "lecturer"] as const;
export type ReferenceDeletionKind = (typeof REFERENCE_DELETION_KINDS)[number];

/**
 * Shared policy for Course/CRN/Lecturer deletion and bulk deactivation routes. Keeping
 * role checks here ensures every route reuses the existing RBAC model.
 */
export function canPreviewReferenceOperation(user: SsoUser) {
  return hasAnyRole(user, ["registry_admin", "system_admin"]);
}

export function canDeleteReference(user: SsoUser) {
  return hasAnyRole(user, ["registry_admin", "system_admin"]);
}

export function canDeleteAllReferences(user: SsoUser) {
  return hasAnyRole(user, ["system_admin"]);
}

export function canDeleteUnreferencedReferences(user: SsoUser) {
  return hasAnyRole(user, ["system_admin"]);
}

export function canDeactivateAllReferences(user: SsoUser) {
  return hasAnyRole(user, ["registry_admin", "system_admin"]);
}

export function deleteAllDecision(safeCount: number, blockedCount: number) {
  if (blockedCount > 0) return { status: "blocked" as const, deletableCount: 0 };
  return { status: "ready" as const, deletableCount: Math.max(0, safeCount) };
}
