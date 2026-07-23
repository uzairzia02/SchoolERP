import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function requireRoles(allowedRoles: string[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?loggedOut=true");
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/login?loggedOut=true");
  }

  return session.user;
}