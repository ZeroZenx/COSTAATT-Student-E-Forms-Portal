import Link from "next/link";
import { redirect } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import DevelopmentSessionLink from "@/components/development-session-link";
import { getCurrentUser, isStaff } from "@/lib/auth";

export default function AdminPage() {
  const user = getCurrentUser();

  if (user && isStaff(user)) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BrandLogo className="auth-logo" />
        <p className="eyeline">Registry administration</p>
        <h1>Staff access is required.</h1>
        <p>Open this area from the portal with a Registry or administrator role.</p>
        <div className="auth-actions">
          <DevelopmentSessionLink href="/api/dev/session">Use local demo session</DevelopmentSessionLink>
          <DevelopmentSessionLink className="secondary-button">Switch demo user</DevelopmentSessionLink>
          <Link className="secondary-button" href="/forms">Return to e-forms</Link>
        </div>
      </section>
    </main>
  );
}
