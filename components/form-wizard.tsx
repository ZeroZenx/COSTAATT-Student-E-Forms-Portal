"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, UploadCloud } from "lucide-react";
import { formDefinitions } from "@/lib/forms";
import {
  advisorOptions,
  courseAdvisorOptions,
  findAdvisorForCourse,
  findAdvisorForProgramme,
  programmeOptions
} from "@/lib/reference-data";
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

export default function FormWizard({ formType, user }: { formType: FormType; user: SsoUser }) {
  const definition = formDefinitions[formType];
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
      advisorName: key === "courseCode" && !current.advisorName
        ? findAdvisorForCourse({ courseCode: value })?.advisorName || current.advisorName
        : current.advisorName,
      courses: current.courses.map((course, courseIndex) => courseIndex === index ? { ...course, [key]: value } : course)
    }));
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
                  <input aria-label={`CRN ${index + 1}`} value={course.crn} onChange={(event) => updateCourse(index, "crn", event.target.value)} />
                  <input list="course-code-options" aria-label={`Course code ${index + 1}`} value={course.courseCode} onChange={(event) => updateCourse(index, "courseCode", event.target.value)} />
                  <input aria-label={`Course title ${index + 1}`} value={course.courseTitle} onChange={(event) => updateCourse(index, "courseTitle", event.target.value)} />
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
        <ReferenceDataLists />
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

function ReferenceDataLists() {
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
      <datalist id="course-code-options">
        {courseAdvisorOptions.map((option) => (
          <option key={option.courseCode} value={option.courseCode}>
            {option.advisorName}
          </option>
        ))}
      </datalist>
    </>
  );
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
