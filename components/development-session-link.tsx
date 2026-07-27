import type { ReactNode } from "react";
import Link from "next/link";

export default function DevelopmentSessionLink({
  children = "Switch demo user",
  className = "primary-button",
  href = "/dev/session"
}: {
  children?: ReactNode;
  className?: string;
  href?: string;
}) {
  if (process.env.NODE_ENV === "production") return null;
  return <Link className={className} href={href}>{children}</Link>;
}
