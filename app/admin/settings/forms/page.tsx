import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import FormSettingsAdmin from "@/components/form-settings-admin";
import { getCurrentUser, isRegistryAdmin } from "@/lib/auth";
import { getAdminSettings } from "@/lib/admin-settings";

export default async function FormSettingsPage() {
  const user = getCurrentUser();
  if (!user || !isRegistryAdmin(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Form availability</p>
          <h1>Registry admin access is required.</h1>
          <p>Form availability controls are restricted to Registry administrators and system administrators.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const settings = await getAdminSettings();
  return (
    <main className="app-shell">
      <AppHeader user={user} staff reviewer />
      <Link className="back-link" href="/admin/settings"><ChevronLeft size={17} /> Back to settings</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry administration</p>
          <h1>Form availability</h1>
          <p>Open or close student e-forms and publish clear student-facing notices.</p>
        </div>
      </section>
      <FormSettingsAdmin initialForms={settings.forms} />
    </main>
  );
}
