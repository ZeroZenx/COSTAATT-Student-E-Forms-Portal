import type { SsoUser, UserRole } from "./types";

export const devIdentityPresets = {
  student: {
    studentId: "00012345",
    firstName: "Darren",
    lastName: "Headley",
    email: "darren.headley@student.costaatt.edu.tt",
    roles: ["student"]
  },
  all_access: {
    studentId: "00012345",
    firstName: "Darren",
    lastName: "Headley",
    email: "darren.headley@student.costaatt.edu.tt",
    roles: ["student", "advisor", "lecturer", "registry_staff", "registry_admin"]
  },
  registry_staff: {
    studentId: "REG-LS",
    firstName: "Lea-Andro",
    lastName: "Sandiford",
    email: "lsandiford@costaatt.edu.tt",
    roles: ["registry_staff"]
  },
  registry_admin: {
    studentId: "REG-RC",
    firstName: "Rhonda",
    lastName: "Cumberbatch",
    email: "rcumberbatch@costaatt.edu.tt",
    roles: ["registry_admin"]
  },
  system_admin: {
    studentId: "SYS-DH",
    firstName: "Darren",
    lastName: "Headley",
    email: "dheadley@costaatt.edu.tt",
    roles: ["system_admin"]
  }
} satisfies Record<string, SsoUser>;

export type DevIdentityPreset = keyof typeof devIdentityPresets;

export function devIdentitySimulatorEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function devPresetFor(value?: string | null) {
  if (!value) return devIdentityPresets.all_access;
  return devIdentityPresets[value as DevIdentityPreset] || devIdentityPresets.all_access;
}

export function reviewerIdentityFromInput(input: {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  studentId?: string | null;
}): SsoUser {
  const name = clean(input.name);
  const email = clean(input.email).toLowerCase();
  const role = normalizeReviewerRole(input.role);
  const [firstName, ...lastParts] = name.split(/\s+/).filter(Boolean);

  if (!name) throw new Error("Reviewer name is required.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid reviewer email is required.");

  return {
    studentId: clean(input.studentId) || `${role.toUpperCase()}-DEV`,
    firstName: firstName || name,
    lastName: lastParts.join(" ") || role,
    email,
    roles: [role]
  };
}

function normalizeReviewerRole(value?: string | null): UserRole {
  return value === "advisor" ? "advisor" : "lecturer";
}

function clean(value?: string | null) {
  return String(value || "").trim();
}
