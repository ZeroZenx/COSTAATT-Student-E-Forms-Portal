import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import SystemSettingsAdmin from "@/components/system-settings-admin";
import { getCurrentUser, isRegistryAdmin } from "@/lib/auth";
import { getAdminSettings } from "@/lib/admin-settings";

export default async function AdminSettingsPage() {
  const user = getCurrentUser();
  if (!user || !isRegistryAdmin(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">System settings</p>
          <h1>Registry admin access is required.</h1>
          <p>Settings are restricted to Registry administrators and system administrators.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const settings = await getAdminSettings();
  return (
    <main className="app-shell">
      <AppHeader user={user} staff reviewer />
      <Link className="back-link" href="/admin/dashboard"><ChevronLeft size={17} /> Back to dashboard</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry administration</p>
          <h1>System settings</h1>
          <p>Manage safe operational settings. Secrets remain controlled by deployment environment variables.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="secondary-button" href="/admin/settings/forms">Form availability</Link>
        </div>
      </section>
      <SystemSettingsAdmin initialSettings={settings.system} />
    </main>
  );
}
