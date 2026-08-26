import { describe, expect, it } from "vitest";
import {
  canDeleteAllReferences,
  canDeleteReference,
  canDeleteUnreferencedReferences,
  canDeactivateAllReferences,
  canPreviewReferenceOperation,
  deleteAllDecision
} from "../lib/reference-deletion-policy";
import { decisionForDependencies, expectedConfirmation, emptyDependencyCounts, loadOptionalWorkflowAssignments, resolveSingleDeletionRecordId } from "../lib/reference-deletion";
import { deletionConfirmationBlocked } from "../lib/reference-deletion-ui";
import type { SsoUser } from "../lib/types";

const user = (roles: SsoUser["roles"]): SsoUser => ({
  studentId: "test-user",
  firstName: "Test",
  lastName: "User",
  email: "test@costaatt.edu.tt",
  roles
});

describe("reference deletion policy", () => {
  it("allows previews and individual deletion only to Registry/System admins", () => {
    expect(canPreviewReferenceOperation(user(["registry_staff"]))).toBe(false);
    expect(canPreviewReferenceOperation(user(["registry_admin"]))).toBe(true);
    expect(canDeleteReference(user(["system_admin"]))).toBe(true);
  });

  it("restricts Delete All to system_admin and Deactivate All to Registry/System admins", () => {
    expect(canDeleteAllReferences(user(["registry_admin"]))).toBe(false);
    expect(canDeleteAllReferences(user(["system_admin"]))).toBe(true);
    expect(canDeactivateAllReferences(user(["registry_admin"]))).toBe(true);
  });

  it("restricts Delete Unreferenced CRNs and Lecturers to system_admin", () => {
    expect(canDeleteUnreferencedReferences(user(["registry_admin"]))).toBe(false);
    expect(canDeleteUnreferencedReferences(user(["registry_staff"]))).toBe(false);
    expect(canDeleteUnreferencedReferences(user(["system_admin"]))).toBe(true);
  });

  it("makes Option B zero-write when any dependency is blocked", () => {
    expect(deleteAllDecision(12, 1)).toEqual({ status: "blocked", deletableCount: 0 });
    expect(deleteAllDecision(12, 0)).toEqual({ status: "ready", deletableCount: 12 });
  });

  it("blocks permanent deletion for every dependency category without changing the snapshot", () => {
    const counts = { ...emptyDependencyCounts(), courseAssignments: 1, crnAssignments: 2, activeRequests: 1, historicalSubmissions: 3, reviewerAssignments: 1, programmeMappings: 1, workflowAssignments: 1, auditRecords: 1, emailRoutingRecords: 1 };
    const decision = decisionForDependencies("lecturer", "delete", counts);
    expect(decision.classification).toBe("blocked");
    expect(decision.reasons).toHaveLength(9);
    expect(counts.historicalSubmissions).toBe(3);
  });

  it("classifies unreferenced CRNs as safe while preserving blocked dependencies", () => {
    expect(decisionForDependencies("crn", "delete_unreferenced", emptyDependencyCounts()).classification).toBe("safe");
    expect(decisionForDependencies("crn", "delete_unreferenced", { ...emptyDependencyCounts(), historicalSubmissions: 1 }).classification).toBe("blocked");
  });

  it("protects Courses that are referenced by CRNs or submissions", () => {
    expect(decisionForDependencies("course", "delete", emptyDependencyCounts()).classification).toBe("safe");
    expect(decisionForDependencies("course", "delete", { ...emptyDependencyCounts(), crnAssignments: 1 }).classification).toBe("blocked");
    expect(decisionForDependencies("course", "delete", { ...emptyDependencyCounts(), historicalSubmissions: 1 }).classification).toBe("blocked");
    expect(expectedConfirmation("course", "single", "delete")).toBe("DELETE RECORD");
    expect(expectedConfirmation("course", "all", "delete_unreferenced")).toBe("DELETE UNREFERENCED COURSES");
    expect(expectedConfirmation("course", "all", "delete")).toBe("DELETE COURSES");
  });

  it("only blocks Lecturer deactivation for active Course or CRN assignments", () => {
    expect(decisionForDependencies("lecturer", "deactivate", { ...emptyDependencyCounts(), historicalSubmissions: 4 }).classification).toBe("safe");
    expect(decisionForDependencies("lecturer", "deactivate", { ...emptyDependencyCounts(), courseAssignments: 1 }).classification).toBe("blocked");
    expect(decisionForDependencies("crn", "deactivate", { ...emptyDependencyCounts(), activeRequests: 9 }).classification).toBe("safe");
  });

  it("requires exact confirmation phrases for individual and bulk operations", () => {
    expect(expectedConfirmation("crn", "single", "delete")).toBe("DELETE RECORD");
    expect(expectedConfirmation("crn", "all", "delete")).toBe("DELETE CRNS");
    expect(expectedConfirmation("lecturer", "all", "delete")).toBe("DELETE LECTURERS");
    expect(expectedConfirmation("lecturer", "all", "deactivate")).toBe("DEACTIVATE LECTURERS");
    expect(expectedConfirmation("crn", "all", "delete_unreferenced")).toBe("DELETE UNREFERENCED CRNS");
    expect(expectedConfirmation("lecturer", "all", "delete_unreferenced")).toBe("DELETE UNREFERENCED LECTURERS");
  });

  it("keeps Delete Unreferenced confirmable when safe rows exist alongside blocked rows", () => {
    expect(deletionConfirmationBlocked("delete", 1264, 16)).toBe(true);
    expect(deletionConfirmationBlocked("delete_unreferenced", 1264, 16)).toBe(false);
    expect(deletionConfirmationBlocked("delete_unreferenced", 0, 23)).toBe(true);
    expect(deletionConfirmationBlocked("deactivate", 0, 23)).toBe(false);
  });

  it("does not abort the confirmation transaction when the optional workflow table is absent", async () => {
    const queries: string[] = [];
    const executor = {
      query: async (sql: string) => {
        queries.push(sql);
        return { rows: [{ table_name: null }] };
      }
    };

    await expect(loadOptionalWorkflowAssignments(executor)).resolves.toEqual([]);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain("to_regclass('public.custom_workflow_assignments')");
  });

  it("uses the record ID stored in a single-record preview during confirmation", () => {
    const storedRecordId = "0a8fafb6-6aa9-4a72-99d4-c48382d9fdf2";
    expect(resolveSingleDeletionRecordId(storedRecordId)).toBe(storedRecordId);
    expect(() => resolveSingleDeletionRecordId(storedRecordId, "different-record-id")).toThrow("does not match");
  });
});
