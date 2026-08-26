import { redirect } from "next/navigation";
import AdminAccessRequired from "@/components/admin-access-required";
import { getCurrentUser, isStaff } from "@/lib/auth";

export default function AdminPage() {
  const user = getCurrentUser();

  if (user && isStaff(user)) {
    redirect("/admin/dashboard");
  }

  return <AdminAccessRequired />;
}
