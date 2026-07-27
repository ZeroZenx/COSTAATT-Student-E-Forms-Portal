import { describe, expect, it } from "vitest";
import { reviewerDevIdentityOptions } from "../lib/dev-identities";

describe("development identity directory", () => {
  it("offers unique real reviewer choices without import placeholders", () => {
    const reviewers = reviewerDevIdentityOptions();
    const emails = reviewers.map((reviewer) => reviewer.email.toLowerCase());
    const names = reviewers.map((reviewer) => reviewer.name.toLowerCase());

    expect(reviewers.find((reviewer) => reviewer.name === "Jesinta Tobas")?.email.toLowerCase()).toBe("nursingdepartment@costaatt.edu.tt");
    expect(reviewers.every((reviewer) => reviewer.source === "reviewer" || reviewer.source === "advisor")).toBe(true);
    expect(names.some((name) => name.includes("blank"))).toBe(false);
    expect(new Set(emails).size).toBe(emails.length);
    expect(new Set(names).size).toBe(names.length);
  });
});
