import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

export default function NotFoundPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BrandLogo className="auth-logo" />
        <p className="eyeline">Page not found</p>
        <h1>The page you requested does not exist.</h1>
        <p>Return to the e-forms hub or open your request dashboard.</p>
        <div className="auth-actions">
          <Link className="primary-button" href="/forms">E-Forms</Link>
          <Link className="secondary-button" href="/student/dashboard">My requests</Link>
        </div>
      </section>
    </main>
  );
}
