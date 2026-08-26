import { hasAnyRole } from "./auth";
import type { CustomFormRecord, CustomSubmissionRecord, SsoUser } from "./types";

export function canCreateCustomForms(user: SsoUser) {
  return hasAnyRole(user, ["form_creator", "form_manager", "registry_admin", "system_admin"]);
}

export function canManageCustomForm(user: SsoUser, form: CustomFormRecord) {
  if (hasAnyRole(user, ["registry_admin", "system_admin"])) return true;
  if (hasAnyRole(user, ["form_manager"]) && sameDepartment(user, form.department)) return true;
  return hasAnyRole(user, ["form_creator"]) && form.createdBy.email.toLowerCase() === user.email.toLowerCase();
}

export function canViewCustomSubmission(user: SsoUser, submission: CustomSubmissionRecord, form?: CustomFormRecord) {
  if (submission.student.studentId === user.studentId) return true;
  if (hasAnyRole(user, ["registry_admin", "system_admin"])) return true;
  if (form && canManageCustomForm(user, form)) return true;
  return submission.assignments.some((assignment) => assignment.assignedTo.email.toLowerCase() === user.email.toLowerCase());
}

export function canActOnCustomSubmission(user: SsoUser, submission: CustomSubmissionRecord, form?: CustomFormRecord) {
  if (hasAnyRole(user, ["registry_admin", "system_admin"])) return true;
  if (form && canManageCustomForm(user, form)) return true;
  return submission.assignments.some((assignment) => (
    assignment.status === "pending" &&
    assignment.assignedTo.email.toLowerCase() === user.email.toLowerCase()
  ));
}

function sameDepartment(user: SsoUser, department: string) {
  return user.roles?.includes("form_manager") && department.trim().length > 0;
}
