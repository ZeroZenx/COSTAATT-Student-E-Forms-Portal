export type ReferenceDeletionUiOperation = "delete" | "delete_unreferenced" | "deactivate";

/**
 * Delete All is blocked by any dependency. Delete Unreferenced is blocked only
 * when there are no safe rows; blocked rows are intentionally preserved.
 */
export function deletionConfirmationBlocked(operationType: ReferenceDeletionUiOperation, safeCount: number, blockedCount: number) {
  if (operationType === "delete") return blockedCount > 0;
  if (operationType === "delete_unreferenced") return safeCount === 0;
  return false;
}
