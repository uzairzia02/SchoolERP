import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLE_DASHBOARD_ROUTES } from "@/constants/routes";
import type { UserRole } from "@prisma/client";

interface RolePageProps {
  params: Promise<{ role: string }>;
}

export default async function RoleDashboardPage({ params }: RolePageProps) {
  const { role } = await params;
  const session = await auth();

  if (!session?.user) redirect("/login");

  const userRole = session.user.role as UserRole;
  const expectedRoute = ROLE_DASHBOARD_ROUTES[userRole];
  const currentPath = `/dashboard/${role}`;

  if (expectedRoute !== currentPath) {
    redirect(expectedRoute);
  }

  redirect(expectedRoute);
}