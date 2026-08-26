import type { SsoUser, UserRole } from "./types";
import { courseCatalogOptions } from "./course-catalog-data";
import { internalRoleDirectory } from "./internal-roles";
import { advisorOptions, courseAdvisorOptions } from "./reference-data";

export const devIdentityPresets = {
  student: {
    studentId: "00012346",
    firstName: "Darren",
    lastName: "Headley",
    email: "dheadley@costaatt.edu.tt",
    roles: ["student"]
  },
  all_access: {
    studentId: "00012346",
    firstName: "Darren",
    lastName: "Headley",
    email: "dheadley@costaatt.edu.tt",
    roles: ["student", "advisor", "lecturer", "registry_staff", "registry_admin"]
  },
  nigel_all_access: {
    studentId: "REG-NT",
    firstName: "Nigel",
    lastName: "Thomas",
    email: "NiThomas@costaatt.edu.tt",
    roles: ["student", "advisor", "lecturer", "registry_staff", "registry_admin"]
  },
  kempson_all_access: {
    studentId: "REG-KB",
    firstName: "Kempson",
    lastName: "Banfield",
    email: "KBanfield@costaatt.edu.tt",
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
export type DevIdentitySource = "preset" | "staff" | "advisor" | "reviewer";
export type DevIdentityOption = {
  id: string;
  label: string;
  group: string;
  name: string;
  email: string;
  studentId: string;
  roles: UserRole[];
  redirectTo: string;
  source: DevIdentitySource;
};

const presetMeta: Record<DevIdentityPreset, { label: string; redirectTo: string }> = {
  student: { label: "Darren as Student", redirectTo: "/forms" },
  all_access: { label: "Darren Demo All Access", redirectTo: "/forms" },
  nigel_all_access: { label: "Nigel Demo All Access", redirectTo: "/forms" },
  kempson_all_access: { label: "Kempson Demo All Access", redirectTo: "/forms" },
  registry_staff: { label: "Registry Staff", redirectTo: "/admin/submissions" },
  registry_admin: { label: "Registry Admin", redirectTo: "/admin/dashboard" },
  system_admin: { label: "System Admin", redirectTo: "/admin/dashboard" }
};

export function devIdentitySimulatorEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function devPresetFor(value?: string | null) {
  if (!value) return devIdentityPresets.all_access;
  return devIdentityPresets[value as DevIdentityPreset] || devIdentityPresets.all_access;
}

export function devPresetRedirectFor(value?: string | null) {
  if (!value) return presetMeta.all_access.redirectTo;
  return presetMeta[value as DevIdentityPreset]?.redirectTo || presetMeta.all_access.redirectTo;
}

export function devPresetLabelFor(value: DevIdentityPreset) {
  return presetMeta[value].label;
}

export function devIdentityOptions(): DevIdentityOption[] {
  const presets = (Object.keys(devIdentityPresets) as DevIdentityPreset[]).map((key) => {
    const user = devIdentityPresets[key];
    return identityOption({
      id: `preset:${key}`,
      label: presetMeta[key].label,
      group: "Preset users",
      source: "preset",
      user,
      redirectTo: presetMeta[key].redirectTo
    });
  });
  const presetEmails = new Set(presets.map((option) => option.email.toLowerCase()));
  const staff = internalRoleDirectory
    .filter((entry) => !presetEmails.has(entry.email.toLowerCase()))
    .map((entry) => identityOption({
      id: `staff:${entry.email.toLowerCase()}`,
      label: `${entry.name} (${roleLabels(entry.roles)})`,
      group: entry.department === "System Administration" ? "System administrators" : "Registry team",
      source: "staff",
      user: userFromName(entry.name, entry.email, staffId(entry.name, entry.roles), entry.roles),
      redirectTo: entry.roles.includes("registry_staff") && !entry.roles.includes("registry_admin") ? "/admin/submissions" : "/admin/dashboard"
    }));

  const reviewers = reviewerOptionsFromCourseMappings();
  const advisors = advisorOptions.map((item) => identityOption({
    id: `advisor:${item.email.toLowerCase()}`,
    label: `${displayName(item.name)} (Advisor)`,
    group: "Advisors",
    source: "advisor",
    user: userFromName(displayName(item.name), item.email, "ADVISOR-DEV", ["advisor"]),
    redirectTo: "/advisor/requests"
  }));
  const directoryOptions = uniquePeople([...reviewers, ...advisors]);

  return [...presets, ...staff, ...directoryOptions]
    .sort((a, b) => {
      const groupOrder = groupRank(a.group) - groupRank(b.group);
      return groupOrder || a.name.localeCompare(b.name);
    });
}

export function reviewerDevIdentityOptions() {
  return devIdentityOptions().filter((option) => option.source === "reviewer" || option.source === "advisor");
}

export function devIdentityFromOptionId(id?: string | null) {
  const option = devIdentityOptions().find((item) => item.id === id);
  if (!option) throw new Error("Select a valid demo identity.");
  return option;
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

export function roleLabels(roles?: UserRole[]) {
  return (roles || ["student"]).map((role) => role.replace(/_/g, " ")).join(", ");
}

export function currentIdentityOptionId(user?: SsoUser | null) {
  if (!user) return "preset:all_access";
  const userRoles = new Set<UserRole>(user.roles || ["student"]);
  return devIdentityOptions()
    .filter((option) => option.email.toLowerCase() === user.email.toLowerCase())
    .sort((a, b) => scoreIdentityMatch(b, userRoles) - scoreIdentityMatch(a, userRoles))[0]?.id || "preset:all_access";
}

function normalizeReviewerRole(value?: string | null): UserRole {
  return value === "advisor" ? "advisor" : "lecturer";
}

function clean(value?: string | null) {
  return String(value || "").trim();
}

function identityOption(input: {
  id: string;
  label: string;
  group: string;
  source: DevIdentitySource;
  user: SsoUser;
  redirectTo: string;
}): DevIdentityOption {
  return {
    id: input.id,
    label: input.label,
    group: input.group,
    name: `${input.user.firstName} ${input.user.lastName}`.trim(),
    email: input.user.email,
    studentId: input.user.studentId,
    roles: input.user.roles || ["student"],
    redirectTo: input.redirectTo,
    source: input.source
  };
}

function reviewerOptionsFromCourseMappings() {
  const reviewers = new Map<string, DevIdentityOption>();
  for (const item of courseCatalogOptions) {
    if (!item.reviewerName || !item.reviewerEmail) continue;
    const email = item.reviewerEmail.toLowerCase();
    const role = item.reviewerRole === "lecturer" ? "lecturer" : "advisor";
    reviewers.set(`reviewer:${role}:${email}`, identityOption({
      id: `reviewer:${role}:${email}`,
      label: `${displayName(item.reviewerName)} (${role === "lecturer" ? "Lecturer" : "Advisor"})`,
      group: "Course reviewers",
      source: "reviewer",
      user: userFromName(displayName(item.reviewerName), item.reviewerEmail, `${role.toUpperCase()}-DEV`, [role]),
      redirectTo: "/advisor/requests"
    }));
  }
  for (const item of courseAdvisorOptions) {
    if (item.lecturerName && item.lecturerEmail) {
      const email = item.lecturerEmail.toLowerCase();
      const id = `reviewer:lecturer:${email}`;
      if (!reviewers.has(id)) {
        reviewers.set(id, identityOption({
          id,
          label: `${displayName(item.lecturerName)} (Lecturer)`,
          group: "Course reviewers",
          source: "reviewer",
          user: userFromName(displayName(item.lecturerName), item.lecturerEmail, "LECTURER-DEV", ["lecturer"]),
          redirectTo: "/advisor/requests"
        }));
      }
    }
    if (item.advisorName && item.advisorEmail) {
      const email = item.advisorEmail.toLowerCase();
      const id = `reviewer:advisor:${email}`;
      if (!reviewers.has(id)) {
        reviewers.set(id, identityOption({
          id,
          label: `${displayName(item.advisorName)} (Advisor)`,
          group: "Course reviewers",
          source: "reviewer",
          user: userFromName(displayName(item.advisorName), item.advisorEmail, "ADVISOR-DEV", ["advisor"]),
          redirectTo: "/advisor/requests"
        }));
      }
    }
  }
  return Array.from(reviewers.values());
}

function userFromName(name: string, email: string, studentId: string, roles: UserRole[]): SsoUser {
  const [firstName, ...lastParts] = name.split(/\s+/).filter(Boolean);
  return {
    studentId,
    firstName: firstName || name,
    lastName: lastParts.join(" ") || roles[0],
    email: email.trim(),
    roles
  };
}

function displayName(name: string) {
  const value = clean(name);
  if (!value.includes(",")) return value;
  const [last, first] = value.split(",").map((part) => part.trim());
  return [first, last].filter(Boolean).join(" ");
}

function staffId(name: string, roles: UserRole[]) {
  const prefix = roles.includes("system_admin") ? "SYS" : "REG";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return `${prefix}-${initials || "DEV"}`;
}

function groupRank(group: string) {
  return ["Preset users", "System administrators", "Registry team", "Course reviewers", "Advisors"].indexOf(group);
}

function uniquePeople(options: DevIdentityOption[]) {
  const emails = new Set<string>();
  const names = new Set<string>();
  return options.filter((option) => {
    const email = option.email.trim().toLowerCase();
    const name = option.name.trim().toLowerCase();
    if (!email || !name || name === "blank" || name.startsWith("blank ")) return false;
    if (emails.has(email) || names.has(name)) return false;
    emails.add(email);
    names.add(name);
    return true;
  });
}

function scoreIdentityMatch(option: DevIdentityOption, userRoles: Set<UserRole>) {
  return option.roles.filter((role) => userRoles.has(role)).length;
}
