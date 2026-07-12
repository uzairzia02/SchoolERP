import { auth } from "./auth"; 
import { redirect } from "next/navigation";

export async function requireRoles(allowedRoles: string[]) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED: Please login first.");
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("UNAUTHORIZED: You do not have permission.");
  }

  return session.user;
}