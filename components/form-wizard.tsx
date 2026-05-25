"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, UploadCloud } from "lucide-react";
import { formDefinitions } from "@/lib/forms";
import {
  advisorOptions,
  courseAdvisorOptions,
  findAdvisorForProgramme,
  programmeOptions
} from "@/lib/reference-data";
import type { CourseLookupField, CourseLookupMatch } from "@/lib/reference-data";
import type { CourseLine, FormType, SsoUser, SubmissionPayload } from "@/lib/types";

const steps = ["Student details", "Request details", "Declarations", "Review & submit"];

type WizardState = {
  academicYear: string;
  semester: string;
  programme: string;
  degree: string;
  phone: string;
  advisorName: string;
  advisorDate: string;
  requestType: string;
  studentComment: string;
  courses: CourseLine[];
  declarations: string[];
  attachment?: File;
};

type CourseLookupLine = CourseLine & {
  lookupMatches?: CourseLookupMatch[];
  requiresSelection?: boolean;
  lookupWarning?: string;
  locked?: boolean;
};

type ReferenceOptions = {
  crns: CourseLookupMatch[];
  courseCodes: CourseLookupMatch[];
  courseTitles: CourseLookupMatch[];
};

export default function FormWizard({ formType, user }: { formType: FormType; user: SsoUser }) {
  const definition = formDefinitions[formType];
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOptions>({ crns: [], courseCodes: [], courseTitles: [] });
  const [state, setState] = useState<WizardState>({
    academicYear: "2026/2027",
    semester: "",
    programme: "",
    degree: "",
    phone: "",
    advisorName: "",
    advisorDate: "",
    requestType: definition.requestTypes[0],
    studentComment: "",
    courses: [{ crn: "", courseCode: "", courseTitle: "" }],
    declarations: []
  });

  const payload: SubmissionPayload = useMemo(() => ({
    formType,
    requestType: state.requestType,
    academicYear: state.academicYear,
    semester: state.semester,
    programme: state.programme,
    degree: state.degree,
    phone: state.phone,
    advisorName: state.advisorName,
    advisorDate: state.advisorDate,
    courses: state.courses.filter((course) => course.crn || course.courseCode || course.courseTitle),
    declarations: state.declarations,
    studentComment: state.studentComment
  }), [formType, state]);

  useEffect(() => {
    let active = true;
    fetch("/api/reference/options")
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (active && result) setReferenceOptions(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function updateProgramme(programme: string) {
    const advisor = findAdvisorForProgramme(programme);
    setState((current) => ({
      ...current,
      programme,
      advisorName: current.advisorName || advisor?.advisorName || ""
    }));
  }

  function updateCourse(index: number, key: keyof CourseLine, value: string) {
    setState((current) => ({
      ...current,
      courses: current.courses.map((course, courseIndex) => courseIndex === index ? {
        ...course,
        [key]: value,
        advisorName: undefined,
        advisorEmail: undefined,
        lecturerName: undefined,
        lecturerEmail: undefined,
        campus: undefined,
        section: undefined,
        noLecturerAssigned: false,
        lookupMatches: undefined,
        requiresSelection: false,
        lookupWarning: undefined,
        locked: false
      } : course)
    }));
  }

  function applyCourseMatch(index: number, match: CourseLookupMatch) {
    setState((current) => ({
      ...current,
      advisorName: current.advisorName || match.advisorName || match.lecturerName || "",
      courses: current.courses.map((course, courseIndex) => courseIndex === index ? {
        ...course,
        crn: match.crn || course.crn,
        courseCode: match.courseCode,
        courseTitle: match.courseTitle,
        advisorName: match.advisorName,
        advisorEmail: match.advisorEmail,
        lecturerName: match.lecturerName || "",
        lecturerEmail: match.lecturerEmail || "",
        campus: match.campus,
        section: match.section,
        noLecturerAssigned: match.noReviewerMapping,
        lookupMatches: undefined,
        requiresSelection: false,
        lookupWarning: undefined,
        locked: true
      } : course)
    }));
  }

  async function lookupCourse(index: number, field: CourseLookupField, value: string) {
    updateCourse(index, field, value);
    if (!value.trim()) return;
    const response = await fetch(`/api/reference/lookup?field=${field}&value=${encodeURIComponent(value)}`);
    if (!response.ok) return;
    const result: {
      matches?: CourseLookupMatch[];
      selectedMatch?: CourseLookupMatch | null;
      requiresSelection?: boolean;
      warning?: string;
    } = await response.json();

    if (result.requiresSelection && result.matches?.length) {
      setState((current) => ({
        ...current,
        courses: current.courses.map((course, courseIndex) => courseIndex === index ? {
          ...course,
          [field]: value,
          lookupMatches: result.matches,
          requiresSelection: true,
          lookupWarning: "Select the correct CRN and section for this course.",
          locked: false
        } : course)
      }));
      return;
    }

    if (result.selectedMatch) {
      applyCourseMatch(index, result.selectedMatch);
      return;
    }

    if (!result.matches?.length) {
      setState((current) => ({
        ...current,
        courses: current.courses.map((course, courseIndex) => courseIndex === index ? {
          ...course,
          [field]: value,
          noLecturerAssigned: true,
          lookupWarning: result.warning || "No lecturer assigned",
          locked: false
        } : course)
      }));
    }
  }

  function selectCourseMatch(index: number, value: string) {
    const current = state.courses[index] as CourseLookupLine | undefined;
    const match = current?.lookupMatches?.find((item) => courseMatchKey(item) === value);
    if (match) applyCourseMatch(index, match);
  }

  function addCourse() {
    setState((current) => current.courses.length >= 5 ? current : {
      ...current,
      courses: [...current.courses, { crn: "", courseCode: "", courseTitle: "" }]
    });
  }

  function toggleDeclaration(value: string) {
    setState((current) => ({
      ...current,
      declarations: current.declarations.includes(value)
        ? current.declarations.filter((item) => item !== value)
        : [...current.declarations, value]
    }));
  }

  async function submit() {
    const validationMessage = validateSubmissionDraft();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const data = new FormData();
    data.set("payload", JSON.stringify(payload));
    if (state.attachment) data.set("attachment", state.attachment);

    const response = await fetch("/api/submissions", { method: "POST", body: data });
    const result = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setMessage(result.error || "Submission could not be saved.");
      return;
    }

    setMessage(`Submitted successfully. Reference ${result.submission.id.slice(0, 8).toUpperCase()}.`);
  }

  function validateSubmissionDraft() {
    if (!state.programme.trim()) return "Select your programme before submitting.";
    if (!state.degree.trim()) return "Enter your certificate or degree before submitting.";
    if (!state.semester.trim()) return "Select the semester before submitting.";
    if (!state.advisorName.trim()) return "Select or enter your academic advisor before submitting.";
    if (payload.courses.length === 0) return "Add at least one course before submitting.";

    const incompleteCourse = state.courses.find((course) => {
      const lookupLine = course as CourseLookupLine;
      return (
        lookupLine.requiresSelection ||
        !course.crn.trim() ||
        !course.courseCode.trim() ||
        !course.courseTitle.trim()
      );
    });

    if (incompleteCourse) {
      if ((incompleteCourse as CourseLookupLine).requiresSelection) {
        return "Select the correct CRN and section for each course before submitting.";
      }
      return "Each course must include a CRN, course code, and course title before submitting.";
    }

    const missingDeclarations = definition.declarations.filter((declaration) => !state.declarations.includes(declaration));
    if (missingDeclarations.length > 0) return "Confirm all required declarations before submitting.";
    if (!state.attachment) return `Upload ${definition.requiredAttachment} before submitting.`;
    return "";
  }

  return (
    <section className="wizard-layout">
      <aside className="step-rail" aria-label="Form progress">
        {steps.map((label, index) => (
          <button className={index === step ? "active" : index < step ? "complete" : ""} key={label} onClick={() => setStep(index)}>
            <span>{index < step ? <Check size={15} /> : index + 1}</span>
            {label}
          </button>
        ))}
      </aside>

      <form className="form-surface" onSubmit={(event) => event.preventDefault()}>
        {step === 0 ? (
          <div className="form-section">
            <h2>Student details</h2>
            <div className="field-grid three">
              <ReadOnlyField label="Student ID" value={user.studentId} />
              <ReadOnlyField label="First name" value={user.firstName} />
              <ReadOnlyField label="Last name" value={user.lastName} />
              <ReadOnlyField label="Email" value={user.email} />
              <Field label="Mobile / telephone" value={state.phone} onChange={(phone) => setState({ ...state, phone })} />
              <Field label="Programme" value={state.programme} onChange={updateProgramme} list="programme-options" required />
              <Field label="Certificate or degree" value={state.degree} onChange={(degree) => setState({ ...state, degree })} required />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="form-section">
            <h2>Request details</h2>
            <div className="field-grid three">
              <SelectField label="Request type" value={state.requestType} options={definition.requestTypes} onChange={(requestType) => setState({ ...state, requestType })} />
              <Field label="Academic year" value={state.academicYear} onChange={(academicYear) => setState({ ...state, academicYear })} required />
              <SelectField label="Semester" value={state.semester} options={["Semester 1", "Semester 2", "Summer"]} onChange={(semester) => setState({ ...state, semester })} />
              <Field label="Academic advisor" value={state.advisorName} onChange={(advisorName) => setState({ ...state, advisorName })} list="advisor-options" required />
              <Field label="Advisor date" type="date" value={state.advisorDate} onChange={(advisorDate) => setState({ ...state, advisorDate })} />
            </div>
            <div className="course-table">
              <div className="course-head">
                <span>CRN</span>
                <span>Course code</span>
                <span>Course title</span>
              </div>
              {state.courses.map((course, index) => (
                <div className="course-row" key={index}>
                  <input list="crn-options" aria-label={`CRN ${index + 1}`} value={course.crn} readOnly={Boolean((course as CourseLookupLine).locked && course.crn)} onChange={(event) => lookupCourse(index, "crn", event.target.value)} />
                  <input list="course-code-options" aria-label={`Course code ${index + 1}`} value={course.courseCode} readOnly={Boolean((course as CourseLookupLine).locked)} onChange={(event) => lookupCourse(index, "courseCode", event.target.value)} />
                  <input list="course-title-options" aria-label={`Course title ${index + 1}`} value={course.courseTitle} readOnly={Boolean((course as CourseLookupLine).locked)} onChange={(event) => lookupCourse(index, "courseTitle", event.target.value)} />
                  <input aria-label={`Assigned lecturer or advisor ${index + 1}`} value={reviewerDisplay(course)} readOnly />
                  {(course as CourseLookupLine).requiresSelection ? (
                    <label className="course-selector">
                      Select CRN / section
                      <select required defaultValue="" onChange={(event) => selectCourseMatch(index, event.target.value)}>
                        <option value="">Choose the correct CRN and section...</option>
                        {(course as CourseLookupLine).lookupMatches?.map((match) => (
                          <option key={courseMatchKey(match)} value={courseMatchKey(match)}>
                            {match.crn || "No CRN"} · {match.courseCode} · {match.courseTitle} · {match.section}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {course.campus || course.section || (course as CourseLookupLine).lookupWarning ? (
                    <p className="course-context">
                      {(course as CourseLookupLine).lookupWarning || `${course.campus || "Campus not assigned"} · ${course.section || "Section not assigned"}`}
                    </p>
                  ) : null}
                </div>
              ))}
              <button type="button" className="secondary-button" onClick={addCourse}>Add another course</button>
            </div>
            <label className="textarea-field">
              Student comment
              <textarea value={state.studentComment} onChange={(event) => setState({ ...state, studentComment: event.target.value })} />
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="form-section">
            <h2>Declarations and attachment</h2>
            <div className="declaration-list">
              {definition.declarations.map((declaration) => (
                <label key={declaration}>
                  <input type="checkbox" checked={state.declarations.includes(declaration)} onChange={() => toggleDeclaration(declaration)} />
                  <span>{declaration}</span>
                </label>
              ))}
            </div>
            <label className="upload-zone">
              <UploadCloud size={28} />
              <strong>{state.attachment?.name || `Upload ${definition.requiredAttachment}`}</strong>
              <span>PDF, PNG, or JPG up to 8 MB</span>
              <input type="file" accept=".pdf,image/png,image/jpeg" onChange={(event) => setState({ ...state, attachment: event.target.files?.[0] })} />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="form-section">
            <h2>Review and submit</h2>
            <div className="review-list">
              <Review label="Form" value={definition.title} />
              <Review label="Request type" value={payload.requestType} />
              <Review label="Student" value={`${user.firstName} ${user.lastName} (${user.studentId})`} />
              <Review label="Programme" value={payload.programme} />
              <Review label="Semester" value={`${payload.academicYear} · ${payload.semester}`} />
              <Review label="Courses" value={payload.courses.map((course) => `${course.crn} ${course.courseCode} ${course.courseTitle}`).join("; ")} />
              <Review label="Attachment" value={state.attachment?.name} />
            </div>
            {message ? <p className={message.startsWith("Submitted") ? "success-message" : "error-message"}>{message}</p> : null}
          </div>
        ) : null}

        <div className="wizard-actions">
          <button type="button" className="secondary-button" disabled={step === 0} onClick={() => setStep(step - 1)}>
            <ChevronLeft size={17} /> Back
          </button>
          {step < steps.length - 1 ? (
            <button type="button" className="primary-button" onClick={() => setStep(step + 1)}>
              Continue <ChevronRight size={17} />
            </button>
          ) : (
            <button type="button" className="primary-button" disabled={submitting} onClick={submit}>
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          )}
        </div>
        <ReferenceDataLists options={referenceOptions} />
      </form>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", required = false, list }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; list?: string }) {
  return (
    <label className="field">
      {label}{required ? <span aria-hidden="true"> *</span> : null}
      <input type={type} list={list} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ReferenceDataLists({ options }: { options: ReferenceOptions }) {
  const codeOptions = options.courseCodes.length > 0 ? options.courseCodes : courseAdvisorOptions.map((option) => normalizeOption(option));
  const titleOptions = options.courseTitles.length > 0 ? options.courseTitles : codeOptions;
  return (
    <>
      <datalist id="programme-options">
        {programmeOptions.map((option) => (
          <option key={option.programme} value={option.programme}>
            {option.advisorName}
          </option>
        ))}
      </datalist>
      <datalist id="advisor-options">
        {advisorOptions.map((option) => (
          <option key={`${option.name}-${option.email}`} value={option.name}>
            {option.email}
          </option>
        ))}
      </datalist>
      <datalist id="crn-options">
        {options.crns.map((option) => (
          <option key={courseMatchKey(option)} value={option.crn || ""}>
            {option.courseCode} · {option.courseTitle} · {option.section}
          </option>
        ))}
      </datalist>
      <datalist id="course-code-options">
        {codeOptions.map((option) => (
          <option key={courseMatchKey(option)} value={option.courseCode}>
            {option.courseTitle || option.advisorName}
          </option>
        ))}
      </datalist>
      <datalist id="course-title-options">
        {titleOptions.map((option) => (
          <option key={courseMatchKey(option)} value={option.courseTitle || option.courseCode}>
            {option.crn ? `${option.crn} · ` : ""}{option.courseCode}
          </option>
        ))}
      </datalist>
    </>
  );
}

function courseMatchKey(match: CourseLookupMatch) {
  return `${match.crn || "no-crn"}|${match.courseCode}|${match.courseTitle}|${match.section}`;
}

function normalizeOption(option: {
  courseCode: string;
  advisorName: string;
  advisorEmail: string;
  courseTitle?: string;
  crn?: string;
  lecturerName?: string;
  lecturerEmail?: string;
  campus?: string;
  section?: string;
}): CourseLookupMatch {
  const reviewerName = option.lecturerName || option.advisorName || "No lecturer assigned";
  const reviewerEmail = option.lecturerEmail || option.advisorEmail || "";
  return {
    ...option,
    courseTitle: option.courseTitle || option.courseCode,
    reviewerName,
    reviewerEmail,
    reviewerRole: option.lecturerEmail ? "lecturer" : option.advisorEmail ? "advisor" : "registry",
    campus: option.campus || "Not assigned",
    section: option.section || "Not assigned",
    noReviewerMapping: !reviewerEmail
  };
}

function reviewerDisplay(course: CourseLine) {
  if (course.lecturerName || course.advisorName) {
    const name = course.lecturerName || course.advisorName;
    const email = course.lecturerEmail || course.advisorEmail;
    return email ? `${name} (${email})` : name || "";
  }
  return course.noLecturerAssigned ? "No lecturer assigned" : "";
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="field readonly">
      {label}
      <input value={value} readOnly />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Select...</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Review({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value || "Not provided"}</strong>
    </div>
  );
}
