import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { formDefinitions, isFormType } from "@/lib/forms";
import FormWizard from "@/components/form-wizard";

export default function FormTypePage({ params }: { params: { type: string } }) {
  if (!isFormType(params.type)) notFound();
  const user = getCurrentUser();
  const definition = formDefinitions[params.type];

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyeline">COSTAATT Student Portal</p>
          <h1>Valid portal SSO is required.</h1>
          <p>Return to the student portal and open this form from your authenticated services page.</p>
          <Link className="primary-button" href="/api/dev/session">Use local demo session</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Link className="back-link" href="/forms"><ChevronLeft size={17} /> Back to e-forms</Link>
      <section className="form-hero">
        <div>
          <p className="eyeline">{definition.code}</p>
          <h1>{definition.title}</h1>
          <p>{definition.description}</p>
        </div>
        <div className="identity-panel">
          <span>Student</span>
          <strong>{user.firstName} {user.lastName}</strong>
          <small>{user.studentId} · {user.email}</small>
        </div>
      </section>
      <FormWizard formType={params.type} user={user} />
    </main>
  );
}
