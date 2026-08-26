import { describe, expect, it, vi } from "vitest";
import type { PoolClient } from "pg";
import { assertActiveSubmissionReferences } from "../lib/reference-consistency";
import type { SubmissionPayload } from "../lib/types";

const payload: SubmissionPayload = {
  formType: "course-override",
  academicYear: "2026/2027",
  semester: "Semester 1",
  programme: "Business",
  degree: "Certificate",
  advisorName: "Advisor",
  courses: [{ crn: "12365", courseCode: "ACCT 126", courseTitle: "Accounting" }],
  declarations: ["confirmed"]
};

describe("submission/reference consistency", () => {
  it("checks every persisted CRN while the shared lock is held", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: "crn-id" }] });
    await assertActiveSubmissionReferences({ query } as unknown as PoolClient, payload);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("kind = 'crn'"), ["12365"]);
  });

  it("rejects a CRN that became inactive or was deleted before insert", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await expect(assertActiveSubmissionReferences({ query } as unknown as PoolClient, payload)).rejects.toThrow("no longer active");
  });
});
