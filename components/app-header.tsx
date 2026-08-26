import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { unreadStudentNotificationCount } from "@/lib/notifications";
import type { SsoUser } from "@/lib/types";

export default async function AppHeader({
  user,
  staff = false,
  reviewer = false,
  unreadNotifications
}: {
  user: SsoUser;
  staff?: boolean;
  reviewer?: boolean;
  unreadNotifications?: number;
}) {
  const unreadCount = unreadNotifications ?? await unreadStudentNotificationCount(user.studentId);
  const userName = `${user.firstName} ${user.lastName}`;
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("");

  return (
    <header className="topbar">
      <Link href="/forms" className="brand-lockup" aria-label="COSTAATT Student Portal">
        <BrandLogo />
        <span>COSTAATT Student Portal</span>
      </Link>
      <nav>
        <Link href="/forms">E-Forms</Link>
        <Link href="/custom-forms">Custom Forms</Link>
        <Link href="/student/dashboard">My Requests</Link>
        <Link href="/student/notifications" className="notification-link">
          Notifications
          {unreadCount > 0 ? <span>{unreadCount}</span> : null}
        </Link>
        {reviewer ? <Link href="/advisor/requests">Reviewer</Link> : null}
        {staff ? <Link href="/admin">Admin</Link> : null}
      </nav>
      <div className="user-chip" title={userName}>{initials}</div>
    </header>
  );
}
