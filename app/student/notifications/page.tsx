import Link from "next/link";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import StudentNotifications from "@/components/student-notifications";
import { getCurrentUser, hasAnyRole, isStaff } from "@/lib/auth";
import { listStudentNotifications, unreadStudentNotificationCount } from "@/lib/notifications";

export default async function StudentNotificationsPage() {
  const user = getCurrentUser();
  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Student notifications</p>
          <h1>Valid portal SSO is required.</h1>
          <p>Return to the student portal and open this service from your authenticated services page.</p>
          <Link className="primary-button" href="/api/dev/session">Use local demo session</Link>
        </section>
      </main>
    );
  }

  const [notifications, unreadNotifications] = await Promise.all([
    listStudentNotifications(user.studentId),
    unreadStudentNotificationCount(user.studentId)
  ]);

  return (
    <main className="app-shell">
      <AppHeader
        user={user}
        staff={isStaff(user)}
        reviewer={hasAnyRole(user, ["advisor", "lecturer", "registry_admin", "system_admin"])}
        unreadNotifications={unreadNotifications}
      />
      <section className="page-intro">
        <div>
          <p className="eyeline">Student notifications</p>
          <h1>Updates for my requests</h1>
          <p>Read Registry and reviewer updates, then jump directly to the request that changed.</p>
        </div>
        <Link className="primary-button" href="/student/dashboard">My requests</Link>
      </section>
      <StudentNotifications initialNotifications={notifications} />
    </main>
  );
}
