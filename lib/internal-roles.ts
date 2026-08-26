import type { UserRole } from "./types";

export type InternalRoleEntry = {
  email: string;
  name: string;
  roles: UserRole[];
  department: "Registry" | "System Administration";
};

// TEMPORARY authorization bridge pending migration to QuickLaunch/AD group-based authorization.
export const internalRoleDirectory: InternalRoleEntry[] = [
  { email: "dheadley@costaatt.edu.tt", name: "Darren Headley", roles: ["system_admin"], department: "System Administration" },
  { email: "dromero@costaatt.edu.tt", name: "Deborah Romero", roles: ["system_admin"], department: "System Administration" },
  { email: "vramrattan@costaatt.edu.tt", name: "Varune Ramrattan", roles: ["system_admin"], department: "System Administration" },
  { email: "RCumberbatch@costaatt.edu.tt", name: "Rhonda Cumberbatch", roles: ["registry_admin", "registry_staff", "system_admin"], department: "Registry" },
  { email: "gking@costaatt.edu.tt", name: "Gwyneth King", roles: ["registry_admin", "registry_staff", "system_admin"], department: "Registry" },
  { email: "NiThomas@costaatt.edu.tt", name: "Nigel Thomas", roles: ["registry_staff", "system_admin"], department: "Registry" },
  { email: "LSandiford@costaatt.edu.tt", name: "Lea-Andro Sandiford", roles: ["registry_staff"], department: "Registry" },
  { email: "mragoopath@costaatt.edu.tt", name: "Maltie Ragoopath", roles: ["registry_staff"], department: "Registry" },
  { email: "kmadoo@costaatt.edu.tt", name: "Karen Madoo", roles: ["registry_staff"], department: "Registry" },
  { email: "kpope@costaatt.edu.tt", name: "Kellyann Pope", roles: ["registry_staff"], department: "Registry" },
  { email: "zmollick@costaatt.edu.tt", name: "Zalina Mollick", roles: ["registry_staff"], department: "Registry" },
  { email: "kriley@costaatt.edu.tt", name: "Kinda Riley", roles: ["registry_staff"], department: "Registry" },
  { email: "KBanfield@costaatt.edu.tt", name: "Kempson Banfield", roles: ["registry_staff", "system_admin"], department: "Registry" },
  { email: "nhobson@costaatt.edu.tt", name: "Nkese Hobson", roles: ["registry_staff"], department: "Registry" }
];

export function internalRolesForEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return [];
  return internalRoleDirectory.find((entry) => entry.email.toLowerCase() === normalized)?.roles || [];
}
