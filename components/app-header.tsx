import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import type { SsoUser } from "@/lib/types";

export default function AppHeader({
  user,
  staff = false,
  reviewer = false
}: {
  user: SsoUser;
  staff?: boolean;
  reviewer?: boolean;
}) {
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
        <Link href="/student/dashboard">My Requests</Link>
        {reviewer ? <Link href="/advisor/requests">Reviewer</Link> : null}
        {staff ? <Link href="/admin">Admin</Link> : null}
      </nav>
      <div className="user-chip" title={userName}>{initials}</div>
    </header>
  );
}
