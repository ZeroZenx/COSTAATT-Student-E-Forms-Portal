import { BookOpenCheck, FileText, RefreshCcw } from "lucide-react";
import type { FormType } from "./types";

export const submissionStatuses = [
  "submitted",
  "pending_advisor_review",
  "advisor_approved",
  "advisor_declined",
  "in_review",
  "needs_information",
  "pending_registry_review",
  "registry_approved",
  "registry_declined",
  "approved",
  "declined",
  "closed"
] as const;

export const formDefinitions: Record<
  FormType,
  {
    title: string;
    shortTitle: string;
    description: string;
    estimate: string;
    requiredAttachment: string;
    code: string;
    icon: typeof FileText;
    declarations: string[];
    requestTypes: string[];
  }
> = {
  "course-override": {
    title: "Course Override Form",
    shortTitle: "Course Override",
    description: "Request a discretionary override for prerequisite, co-requisite, time, semester load, or major restrictions.",
    estimate: "3-5 working days",
    requiredAttachment: "Course Approval Form",
    code: "SAOR-SP01-230821",
    icon: BookOpenCheck,
    declarations: [
      "I have met with an Academic Advisor to determine the course for which I am requesting an override.",
      "I understand that Registry may place me in the next available CRN where applicable."
    ],
    requestTypes: [
      "Override Co-requisite",
      "Override Pre-requisite",
      "Override Time Conflict",
      "Override Semester Load",
      "Override Major Restriction"
    ]
  },
  "academic-standing-petition": {
    title: "Academic Standing Petition",
    shortTitle: "Academic Standing",
    description: "Petition for registration support based on academic standing and advisor guidance.",
    estimate: "3-5 working days",
    requiredAttachment: "Course Approval Form",
    code: "SAOR-SP02-230821",
    icon: FileText,
    declarations: [
      "I have met with an Academic Advisor to determine the courses for which I am required to register this semester.",
      "I understand that outstanding financial holds can block future registration and student services."
    ],
    requestTypes: ["Academic Standing Petition"]
  },
  "repeat-rule": {
    title: "Repeat Rule Form",
    shortTitle: "Repeat Rule",
    description: "Submit repeated course details and confirm GATE/payment requirements before registration processing.",
    estimate: "3-5 working days",
    requiredAttachment: "Course Approval Form",
    code: "SAOR-SP02-230821",
    icon: RefreshCcw,
    declarations: [
      "I have met with an Academic Advisor to determine the courses for which I am required to register this semester.",
      "I understand that GATE will not pay for repeated courses and that payment is my responsibility."
    ],
    requestTypes: ["Repeat Rule Request"]
  }
};

export function isFormType(value: string): value is FormType {
  return value === "course-override" || value === "academic-standing-petition" || value === "repeat-rule";
}
